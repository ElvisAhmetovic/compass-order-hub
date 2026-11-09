import { portalLineHtml } from "../_shared/portalEmailCopy.ts";
// Receives Stripe events. Only signature-verified events change data; each event is processed once.
import { admin, corsHeaders, json } from "../_shared/outreachAuth.ts";
import { APP_URL, BILLING_INBOX, sendBillingEmail, emailShell, button, eur } from "../_shared/stripeApi.ts";
import { verifyStripeSignature, dueDateFromPeriodStart, monthNumberFor } from "../_shared/stripeRules.ts";

const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
type Obj = Record<string, any>;

const ts = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

async function contractFor(db: ReturnType<typeof admin>, subscriptionId?: string | null, contractId?: string | null) {
  if (contractId) {
    const { data } = await db.from("monthly_contracts").select("*").eq("id", contractId).maybeSingle();
    if (data) return data;
  }
  if (!subscriptionId) return null;
  const { data } = await db.from("monthly_contracts").select("*").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  return data;
}

function invoiceSubscription(inv: Obj): { sub: string | null; contractId: string | null } {
  const details = inv.subscription_details ?? inv.parent?.subscription_details ?? {};
  const sub = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id ?? details.subscription ?? null;
  const line = inv.lines?.data?.[0];
  return { sub, contractId: details.metadata?.contract_id ?? line?.metadata?.contract_id ?? null };
}

async function handleInvoice(db: ReturnType<typeof admin>, inv: Obj, paid: boolean) {
  const { sub, contractId } = invoiceSubscription(inv);
  const contract = await contractFor(db, sub, contractId);
  if (!contract) { console.warn("invoice for unknown contract", inv.id); return; }
  const line = inv.lines?.data?.[0];
  const periodStart = line?.period?.start ?? inv.period_start;
  const periodEnd = line?.period?.end ?? inv.period_end;
  const amountCents = paid ? inv.amount_paid : inv.amount_due;

  let installmentId: string | null = null;
  if (paid && periodStart) {
    const due = dueDateFromPeriodStart(periodStart);
    const d = new Date(due + "T00:00:00Z");
    const { data: existing } = await db.from("monthly_installments").select("id, invoice_id").eq("contract_id", contract.id).eq("due_date", due).maybeSingle();
    if (existing) {
      installmentId = existing.id;
      await db.from("monthly_installments").update({ payment_status: "paid", paid_at: ts(inv.status_transitions?.paid_at) ?? new Date().toISOString() }).eq("id", existing.id);
      if (existing.invoice_id) await db.from("invoices").update({ status: "paid" }).eq("id", existing.invoice_id);
    } else {
      const { data: ins } = await db.from("monthly_installments").insert({
        contract_id: contract.id, due_date: due, month_label: `${MONTHS_DE[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
        month_number: monthNumberFor(contract.start_date, due), amount: amountCents / 100, currency: contract.currency,
        payment_status: "paid", paid_at: new Date().toISOString(), client_name: contract.client_name,
        client_email: contract.client_email, website: contract.website, email_sent: true,
      }).select("id").maybeSingle();
      installmentId = ins?.id ?? null;
    }
  }

  await db.from("stripe_payments").upsert({
    stripe_invoice_id: inv.id, contract_id: contract.id, installment_id: installmentId, client_email: contract.client_email,
    stripe_subscription_id: sub, amount: amountCents / 100, currency: String(inv.currency || "eur").toUpperCase(),
    status: paid ? "paid" : "failed", hosted_invoice_url: inv.hosted_invoice_url ?? null, invoice_pdf_url: inv.invoice_pdf ?? null,
    period_start: ts(periodStart), period_end: ts(periodEnd), paid_at: paid ? new Date().toISOString() : null,
  }, { onConflict: "stripe_invoice_id" });

  await db.from("monthly_contracts").update({
    stripe_status: paid ? "active" : "past_due", ...(periodEnd ? { current_period_end: ts(periodEnd) } : {}),
  }).eq("id", contract.id);

  const amount = eur(amountCents, inv.currency || "eur");
  if (paid) {
    await sendBillingEmail(contract.client_email, `Zahlung erhalten / Payment received – ${amount}`, emailShell(`Hallo ${contract.client_name},`,
      `<p>vielen Dank – wir haben Ihre Zahlung über <b>${amount}</b> erhalten.</p><p>Thank you – we received your payment of <b>${amount}</b>.</p>
       ${inv.hosted_invoice_url ? button(inv.hosted_invoice_url, "Beleg ansehen / View receipt") : ""}
       <p style="font-size:13px">Alle Rechnungen: <a href="${APP_URL}/client/invoices">${APP_URL}/client/invoices</a></p>`));
    await sendBillingEmail(BILLING_INBOX, `Stripe payment received: ${contract.client_name} – ${amount}`, emailShell("Stripe payment received",
      `<p>${contract.client_name} (${contract.client_email}) paid ${amount} for ${contract.website || "their package"}.</p>`));
  } else {
    await sendBillingEmail(contract.client_email, "Zahlung fehlgeschlagen / Payment failed", emailShell(`Hallo ${contract.client_name},`,
      `<p>leider konnte Ihre Zahlung über <b>${amount}</b> nicht eingezogen werden. Bitte aktualisieren Sie Ihre Zahlungsmethode oder zahlen Sie erneut.</p>
       <p>Unfortunately your payment of <b>${amount}</b> failed. Please update your payment method or pay again.</p>
       ${inv.hosted_invoice_url ? button(inv.hosted_invoice_url, "Jetzt bezahlen / Pay now") : ""}
       ${portalLineHtml()}`));
    await sendBillingEmail(BILLING_INBOX, `Stripe payment FAILED: ${contract.client_name} – ${amount}`, emailShell("Stripe payment failed",
      `<p>${contract.client_name} (${contract.client_email}) – charge of ${amount} failed. The client was emailed a retry link.</p>`));
  }
}

async function handleSubscription(db: ReturnType<typeof admin>, s: Obj, deleted: boolean) {
  const contract = await contractFor(db, s.id, s.metadata?.contract_id);
  if (!contract) return;
  const periodEnd = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  await db.from("monthly_contracts").update({
    stripe_subscription_id: s.id, stripe_customer_id: typeof s.customer === "string" ? s.customer : contract.stripe_customer_id,
    stripe_status: deleted ? "canceled" : s.status, current_period_end: ts(periodEnd),
    cancel_at: ts(s.cancel_at) ?? (deleted ? new Date().toISOString() : null),
  }).eq("id", contract.id);
  if (deleted) {
    await sendBillingEmail(BILLING_INBOX, `Stripe subscription ended: ${contract.client_name}`, emailShell("Subscription ended",
      `<p>The Stripe subscription of ${contract.client_name} (${contract.client_email}) has ended.</p>`));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const payload = await req.text();
  const ok = await verifyStripeSignature(payload, req.headers.get("stripe-signature"), Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "");
  if (!ok) return json({ error: "Invalid signature" }, 400);

  const event = JSON.parse(payload) as { id: string; type: string; data: { object: Obj } };
  const db = admin();
  const { error: dup } = await db.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup) return json({ received: true, duplicate: true });

  try {
    const o = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
        if (o.mode === "subscription") {
          const id = o.metadata?.contract_id ?? o.client_reference_id;
          if (id) await db.from("monthly_contracts").update({
            payment_method: "stripe", stripe_customer_id: o.customer, stripe_subscription_id: o.subscription,
            stripe_status: "active", stripe_checkout_url: null,
          }).eq("id", id);
        }
        break;
      case "invoice.paid": await handleInvoice(db, o, true); break;
      case "invoice.payment_failed": await handleInvoice(db, o, false); break;
      case "customer.subscription.created":
      case "customer.subscription.updated": await handleSubscription(db, o, false); break;
      case "customer.subscription.deleted": await handleSubscription(db, o, true); break;
    }
    return json({ received: true });
  } catch (e) {
    console.error("webhook error", event.type, e);
    await db.from("stripe_events").delete().eq("id", event.id); // let Stripe retry
    return json({ error: "processing failed" }, 500);
  }
});
