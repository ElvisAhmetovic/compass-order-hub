import { canMarkLinkPaid } from "../_shared/orderLinkRules.ts";
import { portalLineHtml } from "../_shared/portalEmailCopy.ts";
// Receives Stripe events. Only signature-verified events change data; each event is processed once.
import { admin, corsHeaders, json } from "../_shared/outreachAuth.ts";
import { APP_URL, BILLING_INBOX, sendBillingEmail, emailShell, button, eur } from "../_shared/stripeApi.ts";
import { verifyStripeSignature, dueDateFromPeriodStart, monthNumberFor, subscriptionEndUnix, paymentMethodLabel } from "../_shared/stripeRules.ts";
import { stripe, stripeTestMode } from "../_shared/stripeApi.ts";
import { refundStatus, sessionIsPaid } from "../_shared/stripeRules.ts";

const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
type Obj = Record<string, any>;

const ts = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

/** In-app bell notification for every admin (never blocks the webhook). */
async function notifyAdmins(db: ReturnType<typeof admin>, title: string, message: string, type: string) {
  try {
    const { data } = await db.from("user_roles").select("user_id").eq("role", "admin");
    const rows = (data ?? []).map((r: { user_id: string }) => ({ user_id: r.user_id, title, message, type, action_url: "/monthly-packages" }));
    if (rows.length) await db.from("notifications").insert(rows);
  } catch (e) { console.error("notifyAdmins failed", e); }
}

/** Card/SEPA label and failure reason from the invoice's payment intent. */
async function paymentDetails(inv: Obj): Promise<{ label: string | null; reason: string | null }> {
  const pi = typeof inv.payment_intent === "string" ? inv.payment_intent : inv.payment_intent?.id;
  if (!pi) return { label: null, reason: null };
  try {
    const p = await stripe<Obj>(`payment_intents/${pi}?expand[]=payment_method`);
    const pm = typeof p.payment_method === "object" ? p.payment_method : p.last_payment_error?.payment_method;
    return { label: paymentMethodLabel(pm), reason: p.last_payment_error?.message ?? null };
  } catch (e) { console.error("payment details failed", e); return { label: null, reason: null }; }
}

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

  const details = await paymentDetails(inv);
  await db.from("stripe_payments").upsert({
    payment_method_label: details.label, failure_reason: paid ? null : details.reason,
    payment_intent_id: typeof inv.payment_intent === "string" ? inv.payment_intent : inv.payment_intent?.id ?? null,
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
      `<p>${contract.client_name} (${contract.client_email}) – charge of ${amount} failed.${details.reason ? ` Stripe says: <i>${details.reason}</i>` : ""} The client was emailed a retry link. Stripe retries automatically.</p>
       ${button(`${APP_URL}/monthly-packages`, "Open Monthly Packages")}`));
    await notifyAdmins(db, `Payment failed: ${contract.client_name}`, `${amount} could not be charged${details.reason ? ` – ${details.reason}` : ""}.`, "error");
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
    const finished = !!contract.stripe_ends_at && Date.now() >= new Date(contract.stripe_ends_at).getTime() - 2 * 3600e3;
    if (finished && !contract.renewal_notified_at) {
      await db.from("monthly_contracts").update({ renewal_notified_at: new Date().toISOString() }).eq("id", contract.id);
      await sendBillingEmail(BILLING_INBOX, `Package finished – offer renewal: ${contract.client_name}`, emailShell("Offer a renewal",
        `<p>The ${contract.duration_months}-month package of <b>${contract.client_name}</b> (${contract.client_email}, ${contract.website || ""}) is fully paid and has ended. No further charges will happen.</p>
         <p>Please contact the client and offer a renewal (a new package + Stripe link).</p>${button(`${APP_URL}/monthly-packages`, "Open Monthly Packages")}`));
      await sendBillingEmail(contract.client_email, "Ihr Paket ist abgeschlossen / Your package is complete", emailShell(`Hallo ${contract.client_name},`,
        `<p>Ihr ${contract.duration_months}-Monats-Paket ist vollständig bezahlt und abgeschlossen – vielen Dank! Es werden keine weiteren Zahlungen eingezogen. Möchten Sie verlängern? Antworten Sie einfach auf diese E-Mail, wir senden Ihnen gerne ein Angebot.</p>
         <p>Your ${contract.duration_months}-month package is fully paid and complete – thank you! No further payments will be taken. Would you like to renew? Just reply to this email and we will send you an offer.</p>`));
      await notifyAdmins(db, `Offer renewal: ${contract.client_name}`, `The ${contract.duration_months}-month package is complete.`, "info");
    } else {
      await sendBillingEmail(BILLING_INBOX, `Stripe subscription ended: ${contract.client_name}`, emailShell("Subscription ended",
        `<p>The Stripe subscription of ${contract.client_name} (${contract.client_email}) has ended.</p>`));
    }
  }
}

async function handleOrderPayment(db: ReturnType<typeof admin>, sess: Obj) {
  const linkId = sess.metadata?.link_id;
  if (!linkId || !sessionIsPaid(sess.payment_status)) return;
  const { data: link } = await db.from("order_payment_links").select("*").eq("id", linkId).maybeSingle();
  if (!link) return;
  const cents = Number(sess.amount_total ?? Math.round(Number(link.total_amount) * 100));
  const { data: order } = await db.from("orders").select("id, company_name, contact_email, contact_name").eq("id", link.order_id).maybeSingle();
  // Always record the money; only a still-current link flips order/invoice state.
  await db.from("stripe_payments").upsert({
    checkout_session_id: sess.id, payment_intent_id: typeof sess.payment_intent === "string" ? sess.payment_intent : sess.payment_intent?.id ?? null, order_id: link.order_id, payment_link_id: link.id,
    client_email: order?.contact_email ?? sess.customer_details?.email ?? null,
    amount: cents / 100, currency: String(sess.currency || link.currency).toUpperCase(), status: "paid", paid_at: new Date().toISOString(),
  }, { onConflict: "checkout_session_id" });
  if (!canMarkLinkPaid(link.status)) {
    await sendBillingEmail(BILLING_INBOX, `Stripe payment on a REPLACED link: ${order?.company_name ?? link.order_id}`, emailShell("Check this payment",
      `<p>A payment of ${eur(cents, sess.currency || "eur")} arrived on an old/replaced link "${link.title}". Please check it manually.</p>`));
    return;
  }
  await db.from("order_payment_links").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", link.id);
  await db.from("orders").update({ status_invoice_paid: true }).eq("id", link.order_id);
  await db.from("invoices").update({ status: "paid" }).eq("order_id", link.order_id).in("status", ["sent", "overdue", "partially_paid"]);
  const amount = eur(cents, sess.currency || "eur");
  if (order?.contact_email) await sendBillingEmail(order.contact_email, `Zahlung erhalten / Payment received – ${amount}`, emailShell(`Hallo ${order.contact_name || order.company_name},`,
    `<p>vielen Dank – wir haben Ihre Zahlung über <b>${amount}</b> für <b>${link.title}</b> erhalten.</p><p>Thank you – we received your payment of <b>${amount}</b> for <b>${link.title}</b>.</p>
     <p style="font-size:13px">Alle Zahlungen / All payments: <a href="${APP_URL}/client/invoices">${APP_URL}/client/invoices</a></p>`));
  await sendBillingEmail(BILLING_INBOX, `Stripe payment received: ${order?.company_name ?? ""} – ${amount}`, emailShell("Stripe payment received",
    `<p>${order?.company_name ?? ""} (${order?.contact_email ?? ""}) paid ${amount} for "${link.title}". The order is marked Invoice paid.</p>`));
}

/** Finds our stored payment for a charge (by payment intent, then by Stripe invoice). */
async function paymentForCharge(db: ReturnType<typeof admin>, ch: Obj) {
  const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
  if (pi) {
    const { data } = await db.from("stripe_payments").select("*").eq("payment_intent_id", pi).maybeSingle();
    if (data) return data;
  }
  const inv = typeof ch.invoice === "string" ? ch.invoice : ch.invoice?.id;
  if (inv) {
    const { data } = await db.from("stripe_payments").select("*").eq("stripe_invoice_id", inv).maybeSingle();
    if (data) return data;
  }
  return null;
}

async function handleRefund(db: ReturnType<typeof admin>, ch: Obj) {
  const p = await paymentForCharge(db, ch);
  const amount = eur(ch.amount_refunded ?? 0, ch.currency || "eur");
  if (!p) {
    await sendBillingEmail(BILLING_INBOX, `Stripe refund (unmatched): ${amount}`, emailShell("Stripe refund", `<p>A refund of ${amount} happened on charge ${ch.id}, but no matching payment was found. Please check it manually.</p>`));
    return;
  }
  const status = refundStatus(Number(ch.amount ?? 0), Number(ch.amount_refunded ?? 0));
  await db.from("stripe_payments").update({ status, refunded_amount: (ch.amount_refunded ?? 0) / 100, refunded_at: new Date().toISOString() }).eq("id", p.id);
  if (status === "refunded") {
    if (p.order_id) {
      await db.from("orders").update({ status_invoice_paid: false }).eq("id", p.order_id);
      await db.from("invoices").update({ status: "refunded" }).eq("order_id", p.order_id).eq("status", "paid");
      if (p.payment_link_id) await db.from("order_payment_links").update({ status: "refunded" }).eq("id", p.payment_link_id);
    }
    if (p.installment_id) {
      const { data: inst } = await db.from("monthly_installments").select("invoice_id").eq("id", p.installment_id).maybeSingle();
      await db.from("monthly_installments").update({ payment_status: "unpaid", paid_at: null }).eq("id", p.installment_id);
      if (inst?.invoice_id) await db.from("invoices").update({ status: "refunded" }).eq("id", inst.invoice_id);
    }
  }
  const label = status === "refunded" ? "Refunded" : "Partly refunded";
  await sendBillingEmail(BILLING_INBOX, `Stripe ${label}: ${p.client_email ?? ""} – ${amount}`, emailShell(`Stripe payment ${label.toLowerCase()}`,
    `<p>${amount} of the payment from ${p.client_email ?? "a client"} was refunded. Status is now <b>${label}</b>.</p>`));
  await notifyAdmins(db, `Stripe ${label}`, `${amount} refunded to ${p.client_email ?? "client"}.`, "warning");
}

async function handleDispute(db: ReturnType<typeof admin>, d: Obj, closed: boolean) {
  const p = await paymentForCharge(db, { payment_intent: d.payment_intent, invoice: null });
  if (p) await db.from("stripe_payments").update({ dispute_status: closed ? d.status : "open" }).eq("id", p.id);
  const amount = eur(d.amount ?? 0, d.currency || "eur");
  const who = p?.client_email ?? "unknown client";
  const title = closed ? `Stripe dispute closed (${d.status}): ${who}` : `URGENT – Stripe dispute opened: ${who} – ${amount}`;
  await sendBillingEmail(BILLING_INBOX, title, emailShell(closed ? "Dispute closed" : "Chargeback / dispute opened",
    `<p>${closed ? `The dispute over ${amount} was closed with result <b>${d.status}</b>.` : `${who} disputed a payment of ${amount} (reason: ${d.reason ?? "unknown"}). Respond in the Stripe dashboard before the deadline${d.evidence_details?.due_by ? ` (${new Date(d.evidence_details.due_by * 1000).toLocaleDateString("de-DE")})` : ""}.`}</p>`));
  await notifyAdmins(db, closed ? "Stripe dispute closed" : "Stripe dispute opened", `${who} – ${amount}`, closed ? "info" : "error");
}

async function handleExpired(db: ReturnType<typeof admin>, sess: Obj) {
  const now = new Date().toISOString();
  if (sess.metadata?.link_id) await db.from("order_payment_links").update({ expired_at: now }).eq("id", sess.metadata.link_id).eq("status", "pending");
  const cid = sess.metadata?.contract_id ?? (sess.mode === "subscription" ? sess.client_reference_id : null);
  if (cid) await db.from("monthly_contracts").update({ stripe_checkout_expired_at: now }).eq("id", cid).is("stripe_subscription_id", null);
}

async function handleActionRequired(db: ReturnType<typeof admin>, inv: Obj) {
  const { sub, contractId } = invoiceSubscription(inv);
  const contract = await contractFor(db, sub, contractId);
  const to = contract?.client_email ?? inv.customer_email;
  if (!to || !inv.hosted_invoice_url) return;
  const amount = eur(inv.amount_due ?? 0, inv.currency || "eur");
  await sendBillingEmail(to, "Bestätigung erforderlich / Payment confirmation needed", emailShell(`Hallo ${contract?.client_name ?? ""},`,
    `<p>Ihre Bank verlangt eine Bestätigung für die Zahlung über <b>${amount}</b>. Bitte bestätigen Sie sie hier.</p>
     <p>Your bank needs you to confirm the payment of <b>${amount}</b>. Please confirm it here.</p>
     ${button(inv.hosted_invoice_url, "Zahlung bestätigen / Confirm payment")}`));
  await sendBillingEmail(BILLING_INBOX, `Stripe: client must confirm payment – ${contract?.client_name ?? to}`, emailShell("Payment needs confirmation",
    `<p>${contract?.client_name ?? to} must confirm a ${amount} payment (3-D Secure). We emailed them the link.</p>`));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const payload = await req.text();
  const ok = await verifyStripeSignature(payload, req.headers.get("stripe-signature"), (stripeTestMode() ? Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET") : Deno.env.get("STRIPE_WEBHOOK_SECRET")) ?? "");
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
          if (id) {
            const c = await contractFor(db, null, id);
            // Fixed-length package: stop the subscription after the agreed number of charges.
            const endUnix = c ? subscriptionEndUnix(o.created ?? Math.floor(Date.now() / 1000), c.duration_months, c.billing_frequency) : null;
            if (endUnix && o.subscription) await stripe(`subscriptions/${o.subscription}`, { cancel_at: endUnix });
            await db.from("monthly_contracts").update({
              payment_method: "stripe", stripe_customer_id: o.customer, stripe_subscription_id: o.subscription,
              stripe_status: "active", stripe_checkout_url: null, stripe_ends_at: ts(endUnix),
            }).eq("id", id);
          }
        } else if (o.mode === "payment") {
          await handleOrderPayment(db, o);
        }
        break;
      case "checkout.session.async_payment_succeeded": if (o.mode === "payment") await handleOrderPayment(db, o); break;
      case "checkout.session.async_payment_failed":
        await sendBillingEmail(BILLING_INBOX, "Stripe delayed payment FAILED", emailShell("Delayed payment failed", `<p>A bank/SEPA payment for checkout ${o.id} (${o.customer_details?.email ?? ""}) failed. Nothing was marked paid.</p>`));
        await notifyAdmins(db, "Stripe delayed payment failed", o.customer_details?.email ?? o.id, "error");
        break;
      case "checkout.session.expired": await handleExpired(db, o); break;
      case "charge.refunded": await handleRefund(db, o); break;
      case "charge.dispute.created": await handleDispute(db, o, false); break;
      case "charge.dispute.closed": await handleDispute(db, o, true); break;
      case "invoice.payment_action_required": await handleActionRequired(db, o); break;
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
