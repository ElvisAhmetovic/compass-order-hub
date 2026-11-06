import { admin, corsHeaders, getTeamUser, json, unsubscribeToken } from "../_shared/outreachAuth.ts";
import { isSendWindow, testRecipient, remainingDailyQuota, sarajevoDate } from "../_shared/outreachRules.ts";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const user = await getTeamUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { id, subject, body, test } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return json({ error: "Missing draft id" }, 400);

  if (test === true) return await sendTest(user, id, subject, body);
  const now = new Date();
  if (!isSendWindow(now)) return json({ error: "Offers can only be sent on weekdays between 09:00 and 17:00." }, 400);

  const db = admin();
  // Count today's sends (Sarajevo day, approximated by the last 24h on the same date)
  const { data: sentRows } = await db.from("outreach_drafts").select("sent_at").eq("status", "sent")
    .gte("sent_at", new Date(now.getTime() - 86_400_000).toISOString());
  const today = sarajevoDate(now);
  const sentToday = (sentRows ?? []).filter((r) => sarajevoDate(new Date(r.sent_at)) === today).length;
  if (remainingDailyQuota(sentToday) <= 0) return json({ error: "Daily limit of 50 offer emails reached." }, 429);

  const { data: draft } = await db.from("outreach_drafts").select("*").eq("id", id).maybeSingle();
  if (!draft || draft.status !== "pending") return json({ error: "Draft is not pending" }, 400);
  const { data: opt } = await db.from("outreach_opt_outs").select("email").eq("email", draft.email.toLowerCase()).maybeSingle();
  if (opt) {
    await db.from("outreach_drafts").update({ status: "rejected", error: "Client unsubscribed" }).eq("id", id);
    return json({ error: "Client unsubscribed from offers" }, 400);
  }

  const finalSubject = (typeof subject === "string" && subject.trim()) ? subject.trim().slice(0, 200) : draft.subject;
  const finalBody = (typeof body === "string" && body.trim()) ? body.slice(0, 5000) : draft.body;
  // Claim the draft so a double click can't send twice
  const { data: claimed } = await db.from("outreach_drafts").update({ status: "sending", subject: finalSubject, body: finalBody })
    .eq("id", id).eq("status", "pending").select();
  if (!claimed?.length) return json({ error: "Already being sent" }, 409);

  const token = await unsubscribeToken(draft.email);
  const unsubUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/outreach-unsubscribe?e=${encodeURIComponent(draft.email)}&t=${token}`;
  const de = draft.language === "de";
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2937">
${finalBody.split(/\n\s*\n/).map((p: string) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}
<p style="color:#6b7280;font-size:12px">invoice@mediaamarketing.com · +49 203 7090 1754 · <a href="https://www.mediaamarketing.com/de">mediaamarketing.com</a></p>
<p style="color:#9ca3af;font-size:11px"><a href="${unsubUrl}" style="color:#9ca3af">${de ? "Keine weiteren Angebote erhalten" : "Don't send me offers anymore"}</a></p></div>`;

  let res: Response; let txt: string;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Media Marketing <noreply@mediaamarketing.com>", to: [draft.email], reply_to: "invoice@mediaamarketing.com",
        subject: finalSubject, html, text: `${finalBody}\n\n${unsubUrl}`,
      }),
    });
    txt = await res.text();
  } catch (e) {
    // Never leave a draft stuck in "sending"
    const msg = `Network error: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500);
    await db.from("outreach_drafts").update({ status: "failed", error: msg, approved_by: user.id, approved_by_name: user.name }).eq("id", id);
    return json({ error: "Email failed", details: msg }, 502);
  }
  if (!res.ok) {
    await db.from("outreach_drafts").update({ status: "failed", error: `[${res.status}] ${txt}`.slice(0, 500), approved_by: user.id, approved_by_name: user.name }).eq("id", id);
    return json({ error: "Email failed", status: res.status, details: txt }, 502);
  }
  let resendId: string | null = null;
  try { resendId = JSON.parse(txt).id; } catch { /* ignore */ }
  await db.from("outreach_drafts").update({
    status: "sent", sent_at: new Date().toISOString(), resend_id: resendId, error: null, approved_by: user.id, approved_by_name: user.name,
  }).eq("id", id);
  return json({ ok: true });
});

// Test email: only to the signed-in person who clicked. Draft status and daily limit are untouched.
async function sendTest(user: { email: string | null; name: string }, id: string, subject: unknown, body: unknown) {
  const to = testRecipient(user.email);
  if (!to) return json({ error: "Your account has no email address" }, 400);
  const db = admin();
  const { data: draft } = await db.from("outreach_drafts").select("subject, body").eq("id", id).maybeSingle();
  if (!draft) return json({ error: "Draft not found" }, 404);
  const s = (typeof subject === "string" && subject.trim()) ? subject.trim().slice(0, 200) : draft.subject;
  const b = (typeof body === "string" && body.trim()) ? body.slice(0, 5000) : draft.body;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2937"><p style="color:#b45309"><b>TEST – this is a preview only, the client did not receive it.</b></p>${b.split(/\n\s*\n/).map((p: string) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}</div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Media Marketing <noreply@mediaamarketing.com>", to: [to], subject: `[TEST] ${s}`, html, text: `TEST\n\n${b}` }),
  });
  const txt = await res.text();
  if (!res.ok) return json({ error: "Test email failed", status: res.status, details: txt }, 502);
  return json({ ok: true, to });
}
