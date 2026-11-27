import { z } from "npm:zod@3";
import { admin, corsHeaders, getTeamUser, json, unsubscribeToken } from "../_shared/outreachAuth.ts";
import { outreachReplyTo, renderOutreachHtml, withSubjectRef, OUTREACH_FROM } from "../_shared/outreachRules.ts";

const Body = z.object({ reply_id: z.string().uuid(), subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(10000) });

// Team member answers a client's outreach reply. Human-written only; opt-outs are blocked.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const user = await getTeamUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { reply_id, subject, body } = parsed.data;

  const db = admin();
  const { data: reply } = await db.from("outreach_replies").select("id, draft_id, from_email").eq("id", reply_id).maybeSingle();
  if (!reply) return json({ error: "Reply not found" }, 404);
  const { data: draft } = reply.draft_id
    ? await db.from("outreach_drafts").select("id, email, language").eq("id", reply.draft_id).maybeSingle()
    : { data: null };
  const to = (reply.from_email as string).trim().toLowerCase();
  const { data: opt } = await db.from("outreach_opt_outs").select("email").ilike("email", to).maybeSingle();
  if (opt) return json({ error: "This client opted out of offers. No email was sent." }, 400);

  const de = (draft?.language ?? "de") === "de";
  const token = await unsubscribeToken(to);
  const unsubUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/outreach-unsubscribe?e=${encodeURIComponent(to)}&t=${token}`;
  const finalSubject = withSubjectRef(subject, user.name);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: OUTREACH_FROM, to: [to],
      reply_to: outreachReplyTo(user.name, user.email, draft?.id, Deno.env.get("OUTREACH_INBOUND_DOMAIN")),
      subject: finalSubject, html: renderOutreachHtml(body, { de, contactName: user.name, unsubUrl }),
      text: `${body}${user.name ? `\n\n${de ? "Ihr Ansprechpartner" : "Your contact"}: ${user.name}` : ""}\n\n${unsubUrl}`,
    }),
  });
  const txt = await res.text();
  let resendId: string | null = null;
  try { resendId = JSON.parse(txt).id ?? null; } catch { /* ignore */ }
  await db.from("outreach_messages").insert({
    draft_id: draft?.id ?? null, reply_id, to_email: to, subject: finalSubject, body,
    sent_by: user.id, sent_by_name: user.name, resend_id: resendId,
    status: res.ok ? "sent" : "failed", error: res.ok ? null : `[${res.status}] ${txt}`.slice(0, 500),
  });
  if (!res.ok) { console.error(`Resend failed [${res.status}]: ${txt}`); return json({ error: "Email failed", status: res.status, details: txt }, 502); }
  await db.from("outreach_replies").update({ read_at: new Date().toISOString() }).eq("id", reply_id).is("read_at", null);
  return json({ ok: true });
});
