// Stripe billing actions for team (create link, cancel) and clients (overview, pay, cancel, manage card).
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { admin, corsHeaders, json } from "../_shared/outreachAuth.ts";
import { stripe, APP_URL, BILLING_INBOX, sendBillingEmail, emailShell, button, eur } from "../_shared/stripeApi.ts";
import { orderLinkAmountCents } from "../_shared/orderLinkRules.ts";
import { portalLineHtml } from "../_shared/portalEmailCopy.ts";
import { must } from "../_shared/dbResult.ts";
import { cycleAmountCents, recurringFor, productNameFor } from "../_shared/stripeRules.ts";

const Body = z.object({
  action: z.enum(["create_checkout", "cancel", "resume", "overview", "pay", "portal", "create_order_link", "send_order_link"]),
  order_id: z.string().uuid().optional(),
  link_id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(300).optional(),
  net_amount: z.number().positive().max(1_000_000).optional(),
  vat_enabled: z.boolean().optional(),
  vat_rate: z.number().min(0).max(30).optional(),
  currency: z.enum(["EUR", "USD", "GBP", "CHF"]).optional(),
  contract_id: z.string().uuid().optional(),
  send_email: z.boolean().optional(),
  product_name: z.string().trim().min(1).max(120).optional(),
  product_description: z.string().trim().max(300).optional(),
});

type Caller = { id: string; email: string; isClient: boolean; system?: boolean };

async function getCaller(req: Request): Promise<Caller | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  // Server-to-server (confirm-offer): service-role token, limited to create_checkout below.
  if (auth.slice(7) === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return { id: "system", email: "", isClient: false, system: true };
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

type Db = ReturnType<typeof admin>;

/** Client billing: packages, invoices, payment links and payments. Throws on any query error so clients never see "nothing owed" by mistake. */
async function billingOverview(db: Db, caller: Caller, orderId?: string) {
  const { emails, clientIds } = await clientIdentity(caller);
  // Orders this client owns: linked account, login email, or company they own (same rule as public.client_owns_order).
  const companies = must(await db.from("companies").select("id").eq("client_user_id", caller.id)) as { id: string }[];
  const companyIds = companies.map((c) => c.id);
  const orFilter = [`client_id.eq.${caller.id}`, ...emails.map((e) => `contact_email.ilike.${e}`), ...(companyIds.length ? [`company_id.in.(${companyIds.join(",")})`] : [])].join(",");
  const rawOrders = must(await db.from("orders").select("id, contact_email, client_id, company_id").or(orFilter).eq("status_deleted", false)) as
    { id: string; contact_email: string | null; client_id: string | null; company_id: string | null }[];
  let orderIds = rawOrders.filter((o) => o.client_id === caller.id || emails.includes(String(o.contact_email ?? "").toLowerCase()) || (o.company_id && companyIds.includes(o.company_id))).map((o) => o.id);
  if (orderId) {
    if (!orderIds.includes(orderId)) return { contracts: [], installments: [], payments: [], invoices: [], order_links: [] };
    orderIds = [orderId];
  }

  const contractCols = "client_email, id, client_name, website, monthly_amount, billing_frequency, currency, vat_enabled, vat_rate, status, start_date, duration_months, payment_method, stripe_status, current_period_end, cancel_at, stopped_at, order_id";
  let contracts: { id: string; client_email: string }[];
  if (orderId) {
    contracts = must(await db.from("monthly_contracts").select(contractCols).eq("order_id", orderId)) as typeof contracts;
  } else {
    const raw = must(await db.from("monthly_contracts").select(contractCols).or(emails.map((e) => `client_email.ilike.${e}`).join(",")).order("start_date", { ascending: false })) as typeof contracts;
    // ilike treats "_" as a wildcard, so keep exact matches only.
    contracts = raw.filter((c) => emails.includes(String(c.client_email).toLowerCase()));
  }
  const ids = contracts.map((c) => c.id);
  const invCols = "id, invoice_number, issue_date, due_date, total_amount, currency, status, order_id, stripe_payment_link";
  const payCols = "id, contract_id, order_id, amount, currency, status, hosted_invoice_url, invoice_pdf_url, period_start, period_end, paid_at, created_at";
  const none = { data: [], error: null };
  const [inst, pays, invByClient, invByOrder, links, orderPays] = await Promise.all([
    ids.length ? db.from("monthly_installments").select("id, contract_id, month_label, due_date, amount, currency, payment_status, paid_at, invoice_id").in("contract_id", ids).order("due_date", { ascending: false }) : none,
    ids.length ? db.from("stripe_payments").select(payCols).in("contract_id", ids) : none,
    !orderId && clientIds.length ? db.from("invoices").select(invCols).in("client_id", clientIds).neq("status", "draft") : none,
    orderIds.length ? db.from("invoices").select(invCols).in("order_id", orderIds).neq("status", "draft") : none,
    orderIds.length ? db.from("order_payment_links").select("id, order_id, title, description, total_amount, currency, vat_enabled, vat_rate, url, status, paid_at, created_at").in("order_id", orderIds).in("status", ["pending", "paid"]).order("created_at", { ascending: false }) : none,
    orderIds.length ? db.from("stripe_payments").select(payCols).in("order_id", orderIds) : none,
  ]);
  type Row = { id: string; created_at?: string; issue_date?: string };
  const dedupe = (rows: Row[]) => [...new Map(rows.map((r) => [r.id, r])).values()];
  const payments = dedupe([...(must(pays) as Row[]), ...(must(orderPays) as Row[])]).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const invoices = dedupe([...(must(invByClient) as Row[]), ...(must(invByOrder) as Row[])]).sort((a, b) => String(b.issue_date).localeCompare(String(a.issue_date)));
  return { contracts, installments: must(inst), payments, invoices, order_links: must(links) };
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
    const { action, contract_id, send_email, product_name, product_description } = parsed.data;
    const p = parsed.data;
    const db = admin();
    if (caller.system && action !== "create_checkout") return json({ error: "Forbidden" }, 403);

    if (action === "create_order_link" || action === "send_order_link") {
      if (caller.isClient || caller.system) return json({ error: "Forbidden" }, 403);
      const { data: roles } = await db.from("user_roles").select("role").eq("user_id", caller.id);
      if (!(roles ?? []).some((r: { role: string }) => ["admin", "agent", "user"].includes(r.role))) return json({ error: "Forbidden" }, 403);
      if (!p.order_id) return json({ error: "order_id required" }, 400);
      const { data: order } = await db.from("orders").select("id, company_name, contact_name, contact_email").eq("id", p.order_id).maybeSingle();
      if (!order) return json({ error: "Order not found" }, 404);

      if (action === "create_order_link") {
        if (!p.title || !p.net_amount) return json({ error: "title and net_amount required" }, 400);
        const vatOn = !!p.vat_enabled, rate = vatOn ? (p.vat_rate ?? 19) : 0;
        const cents = orderLinkAmountCents(p.net_amount, vatOn, rate);
        const currency = p.currency ?? "EUR";
        // Replace any previous pending link: deactivate it in Stripe so the old amount can't be paid.
        const { data: prev } = await db.from("order_payment_links").select("id, stripe_link_id").eq("order_id", order.id).eq("status", "pending");
        for (const old of prev ?? []) {
          if (old.stripe_link_id) await stripe(`payment_links/${old.stripe_link_id}`, { active: false }).catch((e) => console.error("deactivate failed", e));
          await db.from("order_payment_links").update({ status: "replaced" }).eq("id", old.id);
        }
        const { data: row, error: insErr } = await db.from("order_payment_links").insert({
          order_id: order.id, title: p.title, description: p.description || null, net_amount: p.net_amount,
          vat_enabled: vatOn, vat_rate: rate, total_amount: cents / 100, currency, created_by: caller.id,
        }).select("id").single();
        if (insErr) throw insErr;
        const price = await stripe<{ id: string }>("prices", {
          currency: currency.toLowerCase(), unit_amount: cents,
          product_data: { name: p.title },
        });
        const meta = { order_id: order.id, link_id: row.id };
        const link = await stripe<{ id: string; url: string }>("payment_links", {
          line_items: { 0: { price: price.id, quantity: 1 } },
          metadata: meta,
          payment_intent_data: { metadata: meta, ...(p.description ? { description: p.description } : {}) },
          after_completion: { type: "redirect", redirect: { url: `${APP_URL}/client/invoices?stripe=success` } },
          restrictions: { completed_sessions: { limit: 1 } },
        });
        await db.from("order_payment_links").update({ stripe_link_id: link.id, url: link.url }).eq("id", row.id);
        return json({ id: row.id, url: link.url, total_amount: cents / 100 });
      }

      // send_order_link
      const { data: link } = await db.from("order_payment_links").select("*").eq("order_id", order.id).eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!link?.url) return json({ error: "No open payment link" }, 404);
      if (!order.contact_email) return json({ error: "Order has no client email" }, 400);
      const amount = eur(Math.round(Number(link.total_amount) * 100), link.currency);
      await sendBillingEmail(order.contact_email, `Zahlung / Payment: ${link.title} – ${amount}`, emailShell(
        `Hallo ${order.contact_name || order.company_name},`,
        `<p>für <b>${link.title}</b> können Sie bequem online bezahlen: <b>${amount}</b>${link.vat_enabled ? ` (inkl. ${link.vat_rate}% MwSt.)` : ""}.</p>
         ${link.description ? `<p>${link.description}</p>` : ""}
         <p>You can pay <b>${link.title}</b> online: <b>${amount}</b>${link.vat_enabled ? ` (incl. ${link.vat_rate}% VAT)` : ""}.</p>
         ${button(link.url, "Jetzt bezahlen / Pay now")}
         ${portalLineHtml()}`));
      await db.from("order_payment_links").update({ sent_at: new Date().toISOString() }).eq("id", link.id);
      return json({ ok: true });
    }

    if (action === "overview") {
      if (!caller.isClient) return json({ error: "Clients only" }, 403);
      try {
        return json(await billingOverview(db, caller, p.order_id));
      } catch (e) {
        console.error("overview failed", e);
        return json({ error: "Billing data could not be loaded" }, 500);
      }
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
      const url = action === "create_checkout" ? await createCheckout(contract, product_name, product_description) : await createCheckout(contract);
      if (action === "create_checkout" && send_email) {
        const amount = eur(cycleAmountCents(contract.monthly_amount, contract.billing_frequency, contract.vat_enabled, contract.vat_rate), contract.currency);
        const period = contract.billing_frequency === 12 ? "Jahr / year" : contract.billing_frequency > 1 ? `${contract.billing_frequency} Monate / months` : "Monat / month";
        await sendBillingEmail(contract.client_email, "Ihr Abonnement – bitte Zahlung einrichten / Set up your subscription payment", emailShell(
          `Hallo ${contract.client_name},`,
          `<p>für <b>${productNameFor(product_name, contract.stripe_product_name, contract.client_name, contract.website)}</b> können Sie jetzt bequem per Karte oder SEPA-Lastschrift bezahlen: <b>${amount} pro ${period}</b>.</p>
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
