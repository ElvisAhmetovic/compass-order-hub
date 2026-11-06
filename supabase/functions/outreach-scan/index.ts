import { GatewayError } from "npm:@lovable.dev/ai-gateway";
import { generateDraft, pastServices, topServices, type OutreachOrder } from "../_shared/outreachDraft.ts";
import { loadCatalog, loadClientContext, ORDER_COLS } from "../_shared/outreachContext.ts";
import { admin, corsHeaders, getTeamUser, json } from "../_shared/outreachAuth.ts";
import {
  contractEndedAt, COOLDOWN_DAYS, hasUnpaidInvoice, inCooldown, isInactive, isLapsedContract,
  isMonthlyScanWindow, isWinBack, SCAN_BATCH,
} from "../_shared/outreachRules.ts";

type Order = OutreachOrder;
const norm = (e: string | null | undefined) => (e ?? "").trim().toLowerCase();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const fromCron = body?.source === "cron";
  if (!fromCron && !(await getTeamUser(req))) return json({ error: "Unauthorized" }, 401);
  // Automatic runs only in the first week of each month; the "Find clients now" button works any time.
  if (fromCron && !isMonthlyScanWindow(new Date())) return json({ skipped: "not monthly scan window" });

  const db = admin();
  const { data: lock } = await db.from("outreach_scan_lock").select("*").eq("id", 1).maybeSingle();
  if (lock?.paused_reason && fromCron) return json({ skipped: "paused", reason: lock.paused_reason });
  const nowIso = new Date().toISOString();
  const { data: got } = await db.from("outreach_scan_lock")
    .update({ locked_until: new Date(Date.now() + 10 * 60_000).toISOString(), paused_reason: null })
    .eq("id", 1).lt("locked_until", nowIso).select();
  if (!got?.length) return json({ skipped: "already running" });

  try {
    const now = new Date();
    const orders: Order[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from("orders").select(ORDER_COLS)
        .is("deleted_at", null).not("contact_email", "is", null)
        .order("created_at", { ascending: false }).range(from, from + 999);
      if (error) throw error;
      orders.push(...(data as Order[]));
      if (!data || data.length < 1000) break;
    }

    const byEmail = new Map<string, Order[]>();
    for (const o of orders) {
      const e = norm(o.contact_email);
      if (!e.includes("@")) continue;
      if (!byEmail.has(e)) byEmail.set(e, []);
      byEmail.get(e)!.push(o);
    }

    // Win-back tracking
    const { data: openSent } = await db.from("outreach_drafts").select("id, email, sent_at")
      .eq("status", "sent").is("won_back_order_id", null).not("sent_at", "is", null);
    for (const d of openSent ?? []) {
      const os = byEmail.get(norm(d.email)) ?? [];
      const hit = [...os].reverse().find((o) => isWinBack(new Date(d.sent_at), new Date(o.created_at)));
      if (hit?.id) await db.from("outreach_drafts").update({ won_back_order_id: hit.id, won_back_at: hit.created_at }).eq("id", d.id);
    }

    const [{ data: optOuts }, { data: contracts }, { data: noMail }, { data: recent }, { data: unpaid }, { data: clients }] = await Promise.all([
      db.from("outreach_opt_outs").select("email"),
      db.from("monthly_contracts").select("client_email, client_name, company_address, description, website, monthly_amount, currency, status, stopped_at, updated_at, created_at"),
      db.from("clients").select("email").eq("auto_reminders_enabled", false),
      db.from("outreach_drafts").select("email, created_at")
        .gte("created_at", new Date(now.getTime() - COOLDOWN_DAYS * 86_400_000).toISOString()),
      db.from("invoices").select("invoice_number, status, paid_at, bill_to_email, client_id, order_id").in("status", ["sent", "overdue", "partially_paid"]).is("paid_at", null).limit(2000),
      db.from("clients").select("id, email"),
    ]);

    // Unpaid invoices, mapped to client email via bill-to email, client record or order
    const clientEmail = new Map((clients ?? []).map((c) => [c.id, norm(c.email)]));
    const orderEmail = new Map(orders.map((o) => [o.id, norm(o.contact_email)]));
    const unpaidBy = new Map<string, string[]>();
    for (const i of unpaid ?? []) {
      if (!hasUnpaidInvoice([i])) continue;
      for (const e of new Set([norm(i.bill_to_email), clientEmail.get(i.client_id) ?? "", orderEmail.get(i.order_id) ?? ""])) {
        if (!e) continue;
        unpaidBy.set(e, [...(unpaidBy.get(e) ?? []), i.invoice_number]);
      }
    }

    const active = new Set((contracts ?? []).filter((c) => c.status === "active").map((c) => norm(c.client_email)));
    const lapsed = new Map<string, NonNullable<typeof contracts>[number]>();
    for (const c of contracts ?? []) {
      const e = norm(c.client_email);
      if (e.includes("@") && isLapsedContract(c) && !active.has(e)) lapsed.set(e, c);
    }
    const skip = new Set<string>([
      ...(optOuts ?? []).map((r) => r.email), ...active, ...(noMail ?? []).map((r) => r.email),
    ].filter(Boolean).map(norm));
    const lastContact = new Map<string, Date>();
    for (const r of recent ?? []) lastContact.set(norm(r.email), new Date(r.created_at));

    // Lapsed package clients without orders get a pseudo-history from the contract
    for (const [e, c] of lapsed) {
      if (byEmail.has(e)) continue;
      byEmail.set(e, [{
        contact_email: e, company_name: c.client_name, company_address: c.company_address,
        description: `Package: ${c.description || c.website || "monthly package"}`, price: c.monthly_amount, amount: c.monthly_amount,
        currency: c.currency, created_at: (contractEndedAt(c) ?? new Date(c.created_at)).toISOString(), contact_name: null, status: c.status,
      }]);
    }

    const lastActivity = (e: string, os: Order[]) => {
      const c = lapsed.get(e); const end = c ? contractEndedAt(c) : null;
      const o = new Date(os[0].created_at);
      return end && end > o ? end : o;
    };

    const eligible: [string, Order[]][] = [];
    const skips: { email: string; company_name: string | null; reason: string; details: string }[] = [];
    for (const [e, os] of byEmail) {
      if (skip.has(e) || !isInactive(lastActivity(e, os), now) || inCooldown(lastContact.get(e) ?? null, now)) continue;
      const inv = unpaidBy.get(e);
      if (inv?.length) { skips.push({ email: e, company_name: os[0].company_name, reason: "unpaid_invoice", details: [...new Set(inv)].slice(0, 5).join(", ") }); continue; }
      eligible.push([e, os]);
    }
    await db.from("outreach_skips").delete().eq("reason", "unpaid_invoice");
    if (skips.length) await db.from("outreach_skips").upsert(skips.map((s) => ({ ...s, scanned_at: nowIso })), { onConflict: "email" });

    const candidates = eligible
      .sort((a, b) => lastActivity(b[0], b[1]).getTime() - lastActivity(a[0], a[1]).getTime())
      .slice(0, SCAN_BATCH);

    const catalog = await loadCatalog(db);
    const ourServices = catalog.length ? catalog : topServices(orders);

    let created = 0;
    for (const [email, os] of candidates) {
      try {
        const ctx = await loadClientContext(db, email, os.map((o) => o.id!).filter(Boolean));
        const parsed = await generateDraft(email, os, ourServices, undefined, { ...ctx, lapsedContract: lapsed.has(email) });
        const { error } = await db.from("outreach_drafts").insert({
          email, company_name: os[0].company_name, language: parsed.language, subject: parsed.subject,
          body: parsed.body, reason: parsed.reason, last_order_at: lastActivity(email, os).toISOString(),
          past_services: pastServices(os),
        });
        if (!error) created++;
      } catch (e) {
        if (e instanceof GatewayError && [402, 403, 429].includes(e.httpStatus ?? 0)) {
          await db.from("outreach_scan_lock").update({ paused_reason: `AI service ${e.httpStatus}: ${e.message}` }).eq("id", 1);
          return json({ error: "AI paused", status: e.httpStatus, created }, 200);
        }
        console.error("draft failed", email, e);
      }
    }
    return json({ candidates: eligible.length, created, skipped_unpaid: skips.length, lapsed_contracts: lapsed.size });
  } finally {
    await db.from("outreach_scan_lock").update({ locked_until: new Date().toISOString() }).eq("id", 1);
  }
});
