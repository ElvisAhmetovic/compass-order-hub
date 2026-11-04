import { admin, unsubscribeToken } from "../_shared/outreachAuth.ts";

// Hosted functions serve HTML as plain text, so redirect to a real page in the app
const page = (ok: boolean) => new Response(null, {
  status: 302, headers: { Location: `https://www.empriatech.com/offers-unsubscribed?ok=${ok ? 1 : 0}` },
});

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const t = url.searchParams.get("t") || "";
  if (!email || t !== (await unsubscribeToken(email))) return page(false);
  const db = admin();
  await db.from("outreach_opt_outs").upsert({ email });
  await db.from("outreach_drafts").update({ status: "rejected", error: "Client unsubscribed" }).ilike("email", email).eq("status", "pending");
  return page(true);
});
