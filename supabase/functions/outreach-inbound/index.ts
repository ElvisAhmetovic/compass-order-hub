// Receives client replies to AI outreach emails from Resend (email.received) and stores them for the team inbox.
import { admin, corsHeaders, json } from "../_shared/outreachAuth.ts";
import { verifySvix } from "../_shared/svixVerify.ts";
import { draftIdFromAddresses, parseFromHeader } from "../_shared/outreachRules.ts";

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
  const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(d.email_id)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}` },
  });
  if (res.ok) {
    const full = await res.json();
    text = typeof full.text === "string" ? full.text.slice(0, 50000) : null;
    html = typeof full.html === "string" ? full.html.slice(0, 200000) : null;
  } else console.error(`Resend receiving fetch failed [${res.status}]: ${await res.text()}`);

  const to = Array.isArray(d.to) ? d.to : [];
  let draftId = draftIdFromAddresses(to);
  if (draftId) {
    const { data: dr } = await db.from("outreach_drafts").select("id").eq("id", draftId).maybeSingle();
    if (!dr) draftId = null;
  }
  const from = parseFromHeader(d.from);
  const { error } = await db.from("outreach_replies").insert({
    provider_message_id: d.email_id, draft_id: draftId, from_email: from.email, from_name: from.name,
    to_address: to.join(", ").slice(0, 500), subject: (d.subject ?? "").slice(0, 300), text_body: text, html_body: html,
    received_at: d.created_at ?? new Date().toISOString(),
  });
  if (error && error.code !== "23505") { console.error(error); return json({ error: "Could not store reply" }, 500); }
  return json({ stored: true, linked: !!draftId });
});
