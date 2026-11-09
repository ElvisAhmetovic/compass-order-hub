// Public: summary of one Stripe checkout for the /payment/thank-you page. Looked up by the unguessable session id only.
import { admin, corsHeaders, json } from "../_shared/outreachAuth.ts";
import { stripe } from "../_shared/stripeApi.ts";
import { isSessionId, toReceipt } from "../_shared/receiptRules.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const sid = body?.session_id;
    if (!isSessionId(sid)) return json({ error: "Not found" }, 404);
    // deno-lint-ignore no-explicit-any
    let s: any;
    try {
      s = await stripe(`checkout/sessions/${sid}?expand[]=line_items&expand[]=payment_intent.latest_charge&expand[]=invoice&expand[]=subscription`);
    } catch {
      return json({ error: "Not found" }, 404);
    }
    const db = admin();
    let invoiceNumber: string | null = null;
    const orderId = s.metadata?.order_id;
    if (orderId) {
      const { data } = await db.from("invoices").select("invoice_number").eq("order_id", orderId).neq("status", "draft").order("created_at", { ascending: false }).limit(1);
      invoiceNumber = data?.[0]?.invoice_number ?? null;
    }
    const r = toReceipt(s, sid, invoiceNumber);
    if (!r.title && s.metadata?.contract_id) {
      const { data } = await db.from("monthly_contracts").select("stripe_product_name").eq("id", s.metadata.contract_id).maybeSingle();
      r.title = data?.stripe_product_name ?? "";
    }
    return json(r);
  } catch (e) {
    console.error("payment-receipt failed", e);
    return json({ error: "Could not load payment" }, 500);
  }
});
