// Receives client replies to AI outreach emails from Resend (email.received) and stores them for the team inbox.
import { admin, corsHeaders, json } from "../_shared/outreachAuth.ts";
import { verifySvix } from "../_shared/svixVerify.ts";
import { isBulkMail, shouldForwardReply, renderForwardEmail, ticketSkipReason, buildOutreachTicket, followUpSkipReason, outreachSubjectRef, pickCompanyName, renderReplyFollowUp, type ReplyTemplate, draftIdFromAddresses, parseFromHeader } from "../_shared/outreachRules.ts";

type Received = { email_id?: string; from?: string; to?: string[]; subject?: string; created_at?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.text();
  const ok = await verifySvix(Deno.env.get("RESEND_INBOUND_WEBHOOK_SECRET") ?? "", {
    id: req.headers.get("svix-id"), timestamp: req.headers.get("svix-timestamp"), signature: req.headers.get("svix-signature"),
  }, body);
  if (!ok) return json({ error: "Invalid signature" }, 401);

  let evt: { type?: string; data?: Received };
  try { evt = JSON.parse(body); } catch { return json({ error: "Bad JSON" }, 400); }
  if (evt.type !== "email.received") return json({ ignored: true });
  const d = evt.data ?? {};
  if (!d.email_id || !d.from) return json({ error: "Missing email data" }, 400);

  const db = admin();
  const { data: existing } = await db.from("outreach_replies").select("id").eq("provider_message_id", d.email_id).maybeSingle();
  if (existing) return json({ duplicate: true });

  // Full content comes from Resend's receiving API
  let text: string | null = null, html: string | null = null;
  let inHeaders: Record<string, string> = {};
  const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(d.email_id)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}` },
  });
  if (res.ok) {
    const full = await res.json();
    text = typeof full.text === "string" ? full.text.slice(0, 50000) : null;
    html = typeof full.html === "string" ? full.html.slice(0, 200000) : null;
    if (full.headers && typeof full.headers === "object") inHeaders = full.headers as Record<string, string>;
  } else console.error(`Resend receiving fetch failed [${res.status}]: ${await res.text()}`);

  const to = Array.isArray(d.to) ? d.to : [];
  let draftId = draftIdFromAddresses(to);
  let draft: { subject: string; approved_by_name: string | null; company_name: string | null; email: string; language: string | null; approved_by?: string | null; sent_at?: string | null } | null = null;
  if (draftId) {
    const { data: dr } = await db.from("outreach_drafts").select("id, subject, approved_by_name, company_name, email, language, approved_by, sent_at").eq("id", draftId).maybeSingle();
    if (!dr) draftId = null; else draft = dr;
  }
  const from = parseFromHeader(d.from);
  // Who sent the offer, and is this mail from that team member (their own-mailbox answer copied to the reply address)?
  let ownerEmail: string | null = null;
  if (draft?.approved_by) {
    const { data: u } = await db.auth.admin.getUserById(draft.approved_by);
    ownerEmail = u?.user?.email?.toLowerCase() ?? null;
  }
  const fromTeam = !!ownerEmail && from.email.toLowerCase() === ownerEmail;
  const lookupEmail = draft?.email ?? from.email;
  const { data: ord } = await db.from("orders").select("id, company_name").ilike("contact_email", lookupEmail)
    .is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: cl } = await db.from("clients").select("name").ilike("email", lookupEmail).limit(1).maybeSingle();
  const { data: co } = await db.from("companies").select("name").ilike("email", lookupEmail).limit(1).maybeSingle();
  const companyName = pickCompanyName(draft?.company_name, cl?.name, co?.name, ord?.company_name);
  const { data: saved, error } = await db.from("outreach_replies").insert({
    provider_message_id: d.email_id, draft_id: draftId, from_email: from.email, from_name: from.name,
    to_address: to.join(", ").slice(0, 500), subject: (d.subject ?? "").slice(0, 300), text_body: text, html_body: html, company_name: companyName,
    received_at: d.created_at ?? new Date().toISOString(),
    from_team_user: fromTeam ? draft?.approved_by ?? null : null, from_team_name: fromTeam ? draft?.approved_by_name ?? null : null, read_at: fromTeam ? new Date().toISOString() : null,
  }).select("id").maybeSingle();
  if (error && error.code !== "23505") { console.error(error); return json({ error: "Could not store reply" }, 500); }

  if (fromTeam) return json({ stored: true, linked: true, from_team: true });

  // Forward to the team member who sent the offer (once, real replies only)
  if (saved?.id) {
    const autoReply = followUpSkipReason({ template: { enabled: true, subject_en: "", body_en: "", subject_de: "", body_de: "" }, linkedToOffer: true, fromEmail: from.email, subject: d.subject ?? "", headers: inHeaders, optedOut: false, alreadySent: false }) !== null;
    if (shouldForwardReply({ linked: !!draft, bulk: isBulkMail(inHeaders), autoReply, fromTeam, alreadyForwarded: false, to: ownerEmail })) {
      const domain = Deno.env.get("OUTREACH_INBOUND_DOMAIN")?.trim().toLowerCase();
      const m = renderForwardEmail({ clientName: from.name || from.email, companyName, subject: d.subject ?? "",
        offerDate: draft?.sent_at ? new Date(draft.sent_at).toLocaleDateString("de-DE") : null, text, link: "https://www.empriatech.com/ai-outreach" });
      try {
        const fr = await fetch("https://api.resend.com/emails", { method: "POST",
          headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "Media Marketing <noreply@mediaamarketing.com>", to: [ownerEmail], subject: m.subject, html: m.html, text: m.text,
            reply_to: [from.email, ...(domain && draftId ? [`reply+${draftId}@${domain}`] : [])] }) });
        const ft = await fr.text();
        if (fr.ok) await db.from("outreach_replies").update({ forwarded_to: ownerEmail, forwarded_at: new Date().toISOString() }).eq("id", saved.id).is("forwarded_at", null);
        else console.error(`Forward failed [${fr.status}]: ${ft}`);
      } catch (e) { console.error("Forward failed", e); }
    }
  }

  // Open a ticket for replies to offers or from known clients; newsletters/unknown senders only land in Replies (one per reply via unique outreach_reply_id)
  let ticketId: string | null = null;
  const ticketSkip = ticketSkipReason({ linkedToOffer: !!draft, knownClient: !!(cl || co || ord), headers: inHeaders });
  if (saved?.id && ticketSkip) await db.from("outreach_replies").update({ ticket_skip_reason: ticketSkip }).eq("id", saved.id);
  if (saved?.id && !ticketSkip) {
    const ticket = buildOutreachTicket({ from_email: from.email, from_name: from.name, subject: d.subject ?? "", text_body: text }, draft ? { ...draft, company_name: companyName } : null);
    if (!draft) ticket.company_name = companyName;
    const { data: t, error: tErr } = await db.from("customer_tickets")
      .insert({ ...ticket, order_id: ord?.id ?? null, outreach_reply_id: saved.id }).select("id").maybeSingle();
    if (tErr && tErr.code !== "23505") console.error("Ticket creation failed", tErr);
    ticketId = t?.id ?? null;
  }

  // Automatic follow-up: team-written template only, at most one per offer, never to auto-replies
  let followup: string | null = null;
  if (saved?.id) {
    try { followup = await sendFollowUp(db, saved.id, draftId, draft, from, d.subject ?? "", inHeaders, companyName); }
    catch (e) { console.error("Follow-up failed", e); followup = "failed"; }
    await db.from("outreach_replies").update({ followup_status: followup, followup_sent_at: followup === "sent" ? new Date().toISOString() : null }).eq("id", saved.id);
  }
  return json({ stored: true, linked: !!draftId, ticket_id: ticketId, followup });
});

// deno-lint-ignore no-explicit-any
async function sendFollowUp(db: any, replyId: string, draftId: string | null, draft: { subject: string; approved_by_name: string | null; language: string | null } | null,
  from: { email: string; name: string | null }, subject: string, headers: Record<string, string>, companyName: string | null): Promise<string> {
  const { data: tpl } = await db.from("outreach_reply_template").select("enabled, subject_en, body_en, subject_de, body_de").eq("id", 1).maybeSingle();
  const { data: opt } = await db.from("outreach_opt_outs").select("email").ilike("email", from.email).maybeSingle();
  const { data: prior } = draftId
    ? await db.from("outreach_replies").select("id").eq("draft_id", draftId).eq("followup_status", "sent").neq("id", replyId).limit(1).maybeSingle()
    : { data: null };
  const skip = followUpSkipReason({ template: tpl as ReplyTemplate | null, linkedToOffer: !!draft && !!draftId, fromEmail: from.email, subject, headers, optedOut: !!opt, alreadySent: !!prior });
  if (skip) return `skipped:${skip}`;
  const domain = Deno.env.get("OUTREACH_INBOUND_DOMAIN")?.trim().toLowerCase();
  if (!domain || !draft || !draftId) return "skipped:no_reply_domain";
  // Claim the one-per-offer slot first (unique index), so concurrent replies never send twice
  const { error: claimErr } = await db.from("outreach_replies").update({ followup_status: "sent" }).eq("id", replyId);
  if (claimErr) return claimErr.code === "23505" ? "skipped:already_sent" : "failed";
  const msg = renderReplyFollowUp(tpl as ReplyTemplate, draft.language, { client_name: from.name, company_name: companyName, sender_name: draft.approved_by_name });
  const ref = outreachSubjectRef(draft.approved_by_name ?? "");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `Media Marketing <reply@${domain}>`, to: [from.email], reply_to: [`reply+${draftId}@${domain}`],
      subject: ref ? `${msg.subject} ${ref}` : msg.subject, text: msg.text, html: msg.html,
      headers: { "Auto-Submitted": "auto-replied" },
    }),
  });
  if (!res.ok) { console.error(`Follow-up send failed [${res.status}]: ${await res.text()}`); await db.from("outreach_replies").update({ followup_status: "failed" }).eq("id", replyId); return "failed"; }
  return "sent";
}
