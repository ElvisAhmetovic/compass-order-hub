// Stripe billing actions for team (create link, cancel) and clients (overview, pay, cancel, manage card).
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { admin, corsHeaders, json } from "../_shared/outreachAuth.ts";
import { stripe, APP_URL, BILLING_INBOX, sendBillingEmail, emailShell, button, eur } from "../_shared/stripeApi.ts";
import { cycleAmountCents, recurringFor, productNameFor } from "../_shared/stripeRules.ts";

const Body = z.object({
  action: z.enum(["create_checkout", "cancel", "resume", "overview", "pay", "portal"]),
  contract_id: z.string().uuid().optional(),
  send_email: z.boolean().optional(),
  product_name: z.string().trim().min(1).max(120).optional(),
  product_description: z.string().trim().max(300).optional(),
});

type Caller = { id: string; email: string; isClient: boolean };

async function getCaller(req: Request): Promise<Caller | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data, error } = await sb.auth.getClaims(auth.slice(7));
  const uid = data?.claims?.sub as string | undefined;
  if (error || !uid) return null;
  const { data: roles } = await admin().from("user_roles").select("role").eq("user_id", uid);
  const isClient = (roles ?? []).some((r: { role: string }) => r.role === "client");
  return { id: uid, email: String(data?.claims?.email ?? "").toLowerCase(), isClient };
}

/** All emails and client-record ids that belong to a signed-in client. */
async function clientIdentity(c: Caller) {
  const db = admin();
  const { data: raw } = await db.from("clients").select("id, email, user_id").or(`user_id.eq.${c.id},email.ilike.${c.email}`);
  const rows = (raw ?? []).filter((r: { email: string | null; user_id: string | null }) => r.user_id === c.id || r.email?.toLowerCase() === c.email);
  const emails = new Set<string>([c.email]);
  (rows ?? []).forEach((r: { email: string | null }) => r.email && emails.add(r.email.toLowerCase()));
  return { emails: [...emails].filter(Boolean), clientIds: (rows ?? []).map((r: { id: string }) => r.id) };
}

async function loadContract(id: string) {
  const { data } = await admin().from("monthly_contracts").select("*").eq("id", id).maybeSingle();
  return data;
}

async function createCheckout(contract: Record<string, any>, nameIn?: string, descIn?: string): Promise<string> {
  const db = admin();
  const productName = productNameFor(nameIn, contract.stripe_product_name, contract.client_name, contract.website);
  const productDesc = (descIn !== undefined ? descIn : contract.stripe_product_description ?? "").trim().slice(0, 300);
  let customer = contract.stripe_customer_id as string | null;
  if (!customer) {
    const c = await stripe<{ id: string }>("customers", {
      email: contract.client_email, name: contract.client_name, metadata: { contract_id: contract.id },
    });
    customer = c.id;
  }
  const session = await stripe<{ url: string }>("checkout/sessions", {
    mode: "subscription",
    customer,
    client_reference_id: contract.id,
    line_items: { 0: { quantity: 1, price_data: {
      currency: String(contract.currency || "EUR").toLowerCase(),
      unit_amount: cycleAmountCents(contract.monthly_amount, contract.billing_frequency, contract.vat_enabled, contract.vat_rate),
      recurring: recurringFor(contract.billing_frequency),
      product_data: { name: productName, ...(productDesc ? { description: productDesc } : {}) },
    } } },
    subscription_data: { metadata: { contract_id: contract.id } },
    metadata: { contract_id: contract.id },
    success_url: `${APP_URL}/client/invoices?stripe=success`,
    cancel_url: `${APP_URL}/client/invoices?stripe=cancelled`,
  });
  await db.from("monthly_contracts").update({
    payment_method: "stripe", stripe_customer_id: customer, stripe_checkout_url: session.url,
    stripe_product_name: productName, stripe_product_description: productDesc || null,
    stripe_status: contract.stripe_subscription_id ? contract.stripe_status : "pending",
  }).eq("id", contract.id);
  return session.url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const caller = await getCaller(req);
    if (!caller) return json({ error: "Unauthorized" }, 401);
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { action, contract_id, send_email } = parsed.data;
    const db = admin();

    if (action === "overview") {
      if (!caller.isClient) return json({ error: "Clients only" }, 403);
      const { emails, clientIds } = await clientIdentity(caller);
      const orFilter = emails.map((e) => `client_email.ilike.${e}`).join(",");
      const { data: rawContracts } = await db.from("monthly_contracts")
        .select("client_email, id, client_name, website, monthly_amount, billing_frequency, currency, vat_enabled, vat_rate, status, start_date, duration_months, payment_method, stripe_status, current_period_end, cancel_at, stopped_at")
        .or(orFilter).order("start_date", { ascending: false });
      // ilike treats "_" as a wildcard, so keep exact matches only.
      const contracts = (rawContracts ?? []).filter((c: { client_email: string }) => emails.includes(c.client_email.toLowerCase()));
      const ids = (contracts ?? []).map((c: { id: string }) => c.id);
      const [inst, pays, invs] = await Promise.all([
        ids.length ? db.from("monthly_installments").select("id, contract_id, month_label, due_date, amount, currency, payment_status, paid_at, invoice_id").in("contract_id", ids).order("due_date", { ascending: false }) : { data: [] },
        ids.length ? db.from("stripe_payments").select("id, contract_id, amount, currency, status, hosted_invoice_url, invoice_pdf_url, period_start, period_end, paid_at, created_at").in("contract_id", ids).order("created_at", { ascending: false }) : { data: [] },
        clientIds.length ? db.from("invoices").select("id, invoice_number, issue_date, due_date, total_amount, currency, status, order_id, stripe_payment_link").in("client_id", clientIds).neq("status", "draft").order("issue_date", { ascending: false }) : { data: [] },
      ]);
      return json({ contracts: contracts ?? [], installments: inst.data ?? [], payments: pays.data ?? [], invoices: invs.data ?? [] });
    }

    if (action === "portal") {
      if (!caller.isClient) return json({ error: "Clients only" }, 403);
      const { emails } = await clientIdentity(caller);
      const { data: rows } = await db.from("monthly_contracts").select("stripe_customer_id, client_email").not("stripe_customer_id", "is", null);
      const row = (rows ?? []).find((r: { client_email: string }) => emails.includes(r.client_email.toLowerCase()));
      if (!row) return json({ error: "No Stripe subscription" }, 404);
      const s = await stripe<{ url: string }>("billing_portal/sessions", { customer: row.stripe_customer_id, return_url: `${APP_URL}/client/invoices` });
      return json({ url: s.url });
    }

    if (!contract_id) return json({ error: "contract_id required" }, 400);
    const contract = await loadContract(contract_id);
    if (!contract) return json({ error: "Not found" }, 404);
    if (caller.isClient) {
      const { emails } = await clientIdentity(caller);
      if (!emails.includes(String(contract.client_email).toLowerCase())) return json({ error: "Forbidden" }, 403);
      if (action === "create_checkout") return json({ error: "Forbidden" }, 403);
    }

    if (action === "create_checkout" || action === "pay") {
      if (contract.stripe_subscription_id && ["active", "trialing"].includes(contract.stripe_status)) return json({ error: "Already subscribed" }, 409);
      if (action === "pay" && contract.payment_method !== "stripe") return json({ error: "Stripe not enabled for this package" }, 400);
      const url = await createCheckout(contract);
      if (action === "create_checkout" && send_email) {
        const amount = eur(cycleAmountCents(contract.monthly_amount, contract.billing_frequency, contract.vat_enabled, contract.vat_rate), contract.currency);
        const period = contract.billing_frequency === 12 ? "Jahr / year" : contract.billing_frequency > 1 ? `${contract.billing_frequency} Monate / months` : "Monat / month";
        await sendBillingEmail(contract.client_email, "Ihr Abonnement – bitte Zahlung einrichten / Set up your subscription payment", emailShell(
          `Hallo ${contract.client_name},`,
          `<p>für Ihr Paket (${contract.website || "Media Marketing"}) können Sie jetzt bequem per Karte oder SEPA-Lastschrift bezahlen: <b>${amount} pro ${period}</b>.</p>
           <p>You can now pay your package by card or SEPA direct debit: <b>${amount} per ${period}</b>.</p>
           ${button(url, "Jetzt abonnieren / Subscribe now")}
           <p style="font-size:13px;color:#64748b">Der Link ist 24 Stunden gültig. Danach finden Sie den Zahlungsbutton jederzeit in Ihrem Kundenportal unter Rechnungen: <a href="${APP_URL}/client/invoices">${APP_URL}/client/invoices</a>. Banküberweisung ist weiterhin möglich.<br/>The link is valid for 24 hours; afterwards use the Pay button in your client portal. Bank transfer remains available.</p>`));
      }
      return json({ url });
    }

    if (action === "cancel" || action === "resume") {
      if (!contract.stripe_subscription_id) return json({ error: "No Stripe subscription" }, 400);
      const sub = await stripe<{ cancel_at: number | null; current_period_end: number }>(`subscriptions/${contract.stripe_subscription_id}`, { cancel_at_period_end: action === "cancel" ? "true" : "false" });
      const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null;
      await db.from("monthly_contracts").update({ cancel_at: cancelAt }).eq("id", contract.id);
      if (action === "cancel") {
        const date = cancelAt ? new Date(cancelAt).toLocaleDateString("de-DE") : "";
        const who = caller.isClient ? "by the client" : "by the team";
        await sendBillingEmail(contract.client_email, "Kündigung bestätigt / Cancellation confirmed", emailShell(`Hallo ${contract.client_name},`,
          `<p>Ihr Stripe-Abonnement endet am <b>${date}</b>. Bis dahin bleibt alles aktiv.</p><p>Your Stripe subscription ends on <b>${date}</b>. Until then everything stays active.</p>`));
        await sendBillingEmail(BILLING_INBOX, `Stripe subscription cancelled ${who}: ${contract.client_name}`, emailShell("Subscription cancelled",
          `<p>${contract.client_name} (${contract.client_email}) – cancelled ${who} (${caller.email}). Ends on ${date}.</p>`));
      }
      return json({ ok: true, cancel_at: cancelAt });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("stripe-billing error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
