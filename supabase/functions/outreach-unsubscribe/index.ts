import { admin, unsubscribeToken } from "../_shared/outreachAuth.ts";

const page = (msg: string) => new Response(
  `<!doctype html><meta charset="utf-8"><title>Media Marketing</title><body style="font-family:Arial;padding:40px;text-align:center"><p>${msg}</p></body>`,
  { headers: { "Content-Type": "text/html; charset=utf-8" } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const t = url.searchParams.get("t") || "";
  if (!email || t !== (await unsubscribeToken(email))) return page("Invalid link.");
  const db = admin();
  await db.from("outreach_opt_outs").upsert({ email });
  await db.from("outreach_drafts").update({ status: "rejected", error: "Client unsubscribed" }).ilike("email", email).eq("status", "pending");
  return page("Sie erhalten keine weiteren Angebote von uns. / You will not receive further offers from us.");
});
