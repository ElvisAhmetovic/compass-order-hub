import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { Resend } from "npm:resend@2.0.0";
import { canViewFinanceTotals, ORDER_STATUS_COLUMNS, INVOICE_STATUSES, READ_TABLES } from "./assistantRules.ts";
import { buildReminderEmailHtml, formatPrice, getTranslations } from "./invoiceReminderEmail.ts";

type Row = Record<string, unknown>;
export const InvoiceIds = z.object({ invoice_ids: z.array(z.string().uuid()).min(1).max(20).refine(ids => new Set(ids).size === ids.length, "Duplicate invoice") });
export const BulkStatus = z.object({ entity: z.enum(["orders", "invoices"]), ids: z.array(z.string().uuid()).min(1).max(20).refine(ids => new Set(ids).size === ids.length, "Duplicate record"), status: z.string() }).superRefine((a, ctx) => {
  if (!(a.entity === "orders" ? Object.keys(ORDER_STATUS_COLUMNS) : INVOICE_STATUSES).includes(a.status)) ctx.addIssue({ code: "custom", message: "Invalid status" });
});
export const ClientSummary = z.object({ client_id: z.string().uuid().optional(), query: z.string().min(1).max(200).optional() }).refine(a => a.client_id || a.query, "Choose a client");
export const SupportTicket = z.object({ order_id: z.string().uuid(), client_email: z.string().email().optional(), client_name: z.string().max(200).optional(), company_name: z.string().max(200).optional(), subject: z.string().min(1).max(300), message: z.string().max(5000).optional() });

export function berlinDayWindow(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const midnight = (day: Date) => {
    const offset = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", timeZoneName: "shortOffset" }).formatToParts(day).find(p => p.type === "timeZoneName")?.value ?? "GMT+1";
    const hours = Number(offset.replace("GMT", ""));
    return new Date(day.getTime() - hours * 3600000).toISOString();
  };
  const start = new Date(`${date}T00:00:00Z`);
  const next = new Date(start); next.setUTCDate(next.getUTCDate() + 1);
  return { date, start: midnight(start), end: midnight(next) };
}

export function packageEnd(row: Row): string | null {
  if (row.stripe_ends_at) return String(row.stripe_ends_at);
  if (!row.start_date || !Number.isInteger(Number(row.duration_months)) || Number(row.duration_months) < 1) return null;
  const start = new Date(`${String(row.start_date).slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(start.getTime())) return null;
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + Number(row.duration_months), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), last));
  return end.toISOString();
}

export function reminderEligibility(invoice: Row, order: Row | null, client: Row | null, paid: number, now = new Date()): string | null {
  if (!["sent", "overdue", "partially_paid"].includes(String(invoice.status))) return "Invoice is not unpaid";
  const due = new Date(String(invoice.due_date));
  if (!Number.isFinite(due.getTime()) || due >= now) return "Invoice is not overdue";
  if (invoice.reminders_paused) return "Invoice reminders are paused";
  if (client?.auto_reminders_enabled === false) return "Client reminders are disabled";
  if (order && (order.deleted_at || order.status_deleted || order.status_cancelled || order.status_invoice_paid || ["Cancelled", "Invoice Paid"].includes(String(order.status)))) return "Order is cancelled, deleted or paid";
  if (Number(invoice.total_amount) - paid <= 0) return "No outstanding balance";
  return null;
}

function must<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function visibleRows(table: string, rows: Row[], email: string | null) {
  const money = READ_TABLES[table]?.money ?? [];
  return rows.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => canViewFinanceTotals(email) || !money.includes(key))));
}

export async function dailyBriefing(db: SupabaseClient, email: string | null, now = new Date()) {
  const day = berlinDayWindow(now);
  const cutoff = new Date(now.getTime() + 30 * 86400000).toISOString();
  const [invoices, failures, tickets, reminders] = await Promise.all([
    db.from("invoices").select("id,invoice_number,client_id,bill_to_name,due_date,status", { count: "exact" }).in("status", ["sent", "overdue", "partially_paid"]).lt("due_date", day.start).order("due_date").limit(8),
    db.from("stripe_payments").select("id,client_email,order_id,contract_id,status,failure_reason,created_at", { count: "exact" }).eq("status", "failed").order("created_at", { ascending: false }).limit(8),
    db.from("customer_tickets").select("id,subject,client_email,status,created_at", { count: "exact" }).in("status", ["open", "in_progress"]).order("created_at").limit(8),
    db.from("follow_up_reminders").select("id,company_name,note,assignee_email,remind_at,status", { count: "exact" }).eq("status", "pending").lt("remind_at", day.end).order("remind_at").limit(8),
  ]);
  for (const r of [invoices, failures, tickets, reminders]) if (r.error) throw new Error(r.error.message);
  const ending: Row[] = [];
  let missingEndDates = 0;
  for (let offset = 0; ; offset += 1000) {
    const rows = must(await db.from("monthly_contracts").select("id,client_name,client_email,start_date,duration_months,stripe_ends_at,status").eq("status", "active").order("id").range(offset, offset + 999)) ?? [];
    for (const row of rows) {
      const end = packageEnd(row);
      if (!end) missingEndDates++;
      else if (end >= day.start && end <= cutoff) ending.push({ ...row, ends_at: end });
    }
    if (rows.length < 1000) break;
  }
  ending.sort((a, b) => String(a.ends_at).localeCompare(String(b.ends_at)));
  return {
    date: day.date, timezone: "Europe/Berlin", note: "Counts are exact; each list shows at most eight records. Failed payments include historical failures; verify current billing before following up. Reminder list includes overdue tasks.",
    overdue_invoices: { count: invoices.count, rows: invoices.data }, failed_payments: { count: failures.count, rows: failures.data },
    open_tickets: { count: tickets.count, rows: tickets.data }, reminders_due: { count: reminders.count, rows: reminders.data },
    packages_ending_within_30_days: { count: ending.length, rows: ending.slice(0, 8), missing_end_dates: missingEndDates },
    finance_totals_available: canViewFinanceTotals(email),
  };
}

export async function clientSummary(db: SupabaseClient, email: string | null, args: unknown) {
  const a = ClientSummary.parse(args);
  let q = db.from("clients").select("id,name,email,phone");
  if (a.client_id) q = q.eq("id", a.client_id);
  else {
    const text = String(a.query).replace(/[,()%\\]/g, " ").trim();
    if (!text) throw new Error("Enter a client name or email");
    q = q.or(`name.ilike.%${text}%,email.ilike.%${text}%`);
  }
  const candidates = must(await q.limit(21)) ?? [];
  if (candidates.length !== 1) return { candidates: candidates.slice(0, 20), note: candidates.length ? "Ask the admin to choose an exact client_id; do not guess." : "No matching client found." };
  const client = candidates[0];
  const address = String(client.email ?? "").trim().toLowerCase();
  const orders: Row[] = [];
  if (address) for (let offset = 0; ; offset += 1000) {
    const rows = must(await db.from("orders").select(READ_TABLES.orders.cols.join(",")).ilike("contact_email", address).is("deleted_at", null).order("id").range(offset, offset + 999).returns<Row[]>()) ?? [];
    orders.push(...rows); if (rows.length < 1000) break;
  }
  const invoices: Row[] = [];
  // Include directly linked invoices and bill-to email matches; order-linked rows are fetched in bounded chunks.
  const collectInvoices = async (column: string, value: string | unknown[]) => {
    for (let offset = 0; ; offset += 1000) {
      let query = db.from("invoices").select(READ_TABLES.invoices.cols.join(","));
      query = Array.isArray(value) ? query.in(column, value) : column === "bill_to_email" ? query.ilike(column, value) : query.eq(column, value);
      const rows = must(await query.order("id").range(offset, offset + 999).returns<Row[]>()) ?? [];
      invoices.push(...rows); if (rows.length < 1000) break;
    }
  };
  await collectInvoices("client_id", client.id);
  if (address) await collectInvoices("bill_to_email", address);
  for (let i = 0; i < orders.length; i += 100) await collectInvoices("order_id", orders.slice(i, i + 100).map(o => o.id));
  const uniqueInvoices = [...new Map(invoices.map(row => [row.id, row])).values()];
  const related = async (table: string, column: string) => {
    if (!address) return { count: 0, rows: [], note: "No client email to match" };
    const r = await db.from(table).select(READ_TABLES[table].cols.join(","), { count: "exact" }).ilike(column, address).order(READ_TABLES[table].date, { ascending: false }).limit(15).returns<Row[]>();
    const rows = must(r) ?? [];
    return { count: r.count, rows: visibleRows(table, rows, email) };
  };
  const [packages, tickets, activity, contacts] = await Promise.all([
    related("monthly_contracts", "client_email"), related("customer_tickets", "client_email"), related("client_portal_activity", "user_email"), related("client_email_logs", "sent_to"),
  ]);
  const balance: Record<string, number> = {};
  if (canViewFinanceTotals(email)) {
    for (let i = 0; i < uniqueInvoices.length; i += 100) {
      const group = uniqueInvoices.slice(i, i + 100).filter(inv => ["sent", "overdue", "partially_paid"].includes(String(inv.status)));
      if (!group.length) continue;
      const paid: Record<string, number> = {};
      for (let offset = 0; ; offset += 1000) {
        const rows = must(await db.from("payments").select("id,invoice_id,amount").in("invoice_id", group.map(inv => inv.id)).order("id").range(offset, offset + 999)) ?? [];
        for (const row of rows) paid[row.invoice_id] = (paid[row.invoice_id] ?? 0) + Number(row.amount);
        if (rows.length < 1000) break;
      }
      for (const inv of group) { const currency = String(inv.currency ?? "EUR"); balance[currency] = (balance[currency] ?? 0) + Math.max(0, Number(inv.total_amount) - (paid[String(inv.id)] ?? 0)); }
    }
    for (const currency of Object.keys(balance)) balance[currency] = Math.round(balance[currency] * 100) / 100;
  }
  const latest = (rows: Row[]) => [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 15);
  return { client, orders: { count: orders.length, rows: visibleRows("orders", latest(orders), email) }, invoices: { count: uniqueInvoices.length, rows: visibleRows("invoices", latest(uniqueInvoices), email) }, packages, tickets, portal_activity: activity, contact_history: contacts,
    last_logged_contact_at: contacts.rows[0]?.created_at ?? null, ...(canViewFinanceTotals(email) ? { outstanding_by_currency: balance } : { finance_totals: "Owner-only" }),
    note: "Lists show the latest 15 records. Orders match contact email; packages, tickets, portal activity and contact logs match email. Contact history covers recorded CRM emails only; no unlogged calls or external inbox." };
}

export async function loadReminder(db: SupabaseClient, invoiceId: string, now = new Date()) {
  const invoice = must(await db.from("invoices").select("*").eq("id", invoiceId).maybeSingle());
  if (!invoice) throw new Error("Invoice not found");
  const [order, linkedClient] = await Promise.all([
    invoice.order_id ? db.from("orders").select("id,contact_email,contact_name,company_name,company_address,contact_phone,description,status,status_deleted,status_cancelled,status_invoice_paid,status_resolved,deleted_at").eq("id", invoice.order_id).maybeSingle().then(must) : null,
    invoice.client_id ? db.from("clients").select("id,name,email,phone,address,auto_reminders_enabled").eq("id", invoice.client_id).maybeSingle().then(must) : null,
  ]);
  if (invoice.order_id && !order) throw new Error("Linked order not found");
  const recipient = String(invoice.bill_to_email || linkedClient?.email || order?.contact_email || "").trim().toLowerCase();
  if (!z.string().email().safeParse(recipient).success) throw new Error("No valid client email");
  // Check opt-outs on all matching client rows, not just the linked one.
  const matching = must(await db.from("clients").select("id,auto_reminders_enabled").ilike("email", recipient)) ?? [];
  const client = matching.some(row => row.auto_reminders_enabled === false) ? { ...linkedClient, auto_reminders_enabled: false } : linkedClient;
  let paid = 0;
  for (let offset = 0; ; offset += 1000) {
    const rows = must(await db.from("payments").select("id,amount").eq("invoice_id", invoice.id).order("id").range(offset, offset + 999)) ?? [];
    for (const row of rows) paid += Number(row.amount);
    if (rows.length < 1000) break;
  }
  const reason = reminderEligibility(invoice, order, client, paid, now);
  if (reason) throw new Error(reason);
  const cc = z.array(z.string().email()).parse(Array.from(new Set((Array.isArray(invoice.cc_emails) ? invoice.cc_emails : []).map((e: string) => e.trim().toLowerCase()).filter((e: string) => e !== recipient))));
  return { invoice, order, client, recipient, cc, outstanding: Math.max(0, Number(invoice.total_amount) - paid) };
}

export async function prepareReminders(db: SupabaseClient, args: unknown, email: string | null) {
  const a = InvoiceIds.parse(args);
  const targets = [];
  for (const id of a.invoice_ids) {
    const r = await loadReminder(db, id);
    targets.push({ id, invoice_number: r.invoice.invoice_number, recipient: r.recipient, cc: r.cc, language: r.invoice.language === "de" ? "de" : "en", ...(canViewFinanceTotals(email) ? { outstanding: r.outstanding, currency: r.invoice.currency } : {}) });
  }
  return { ...a, targets };
}

export async function prepareBulk(db: SupabaseClient, args: unknown) {
  const a = BulkStatus.parse(args);
  const fields = a.entity === "orders" ? "id,company_name,contact_email,status,deleted_at" : "id,invoice_number,bill_to_name,status";
  const rows = must(await db.from(a.entity).select(fields).in("id", a.ids).returns<Row[]>()) ?? [];
  if (rows.length !== a.ids.length || rows.some(r => r.deleted_at)) throw new Error("A selected record is missing or deleted");
  return { ...a, targets: a.ids.map(id => rows.find(r => r.id === id)) };
}

export type BatchResult = { id: string; status: "done" | "skipped" | "failed"; message?: string };
export async function executeBatch(ids: string[], perform: (id: string, index: number) => Promise<void>): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  for (let i = 0; i < ids.length; i++) {
    try { await perform(ids[i], i); results.push({ id: ids[i], status: "done" }); }
    catch (error) { results.push({ id: ids[i], status: "failed", message: error instanceof Error ? error.message : "Action failed" }); }
  }
  return results;
}

type ReminderEmail = { from: string; to: string[]; cc?: string[]; subject: string; html: string };
type ReminderSender = (email: ReminderEmail) => Promise<{ error: { message: string } | null }>;
export async function sendConfirmedReminders(db: SupabaseClient, args: unknown, sender?: ReminderSender) {
  const a = InvoiceIds.extend({ targets: z.array(z.object({ id: z.string().uuid(), recipient: z.string().email(), cc: z.array(z.string().email()), language: z.enum(["en", "de"]) })).min(1).max(20) }).parse(args);
  const key = Deno.env.get("RESEND_API_KEY_ABMEDIA");
  if (!key && !sender) throw new Error("Email service is not configured");
  const send: ReminderSender = sender ?? (message => new Resend(key).emails.send(message));
  return executeBatch(a.invoice_ids, async (id, index) => {
    if (index) await new Promise(resolve => setTimeout(resolve, 600));
    const r = await loadReminder(db, id);
    const target = a.targets.find(t => t.id === id);
    if (!target || target.recipient !== r.recipient || target.cc.join(",") !== r.cc.join(",") || target.language !== (r.invoice.language === "de" ? "de" : "en")) throw new Error("Recipient or language changed; propose again");
    const number = Number(r.invoice.reminder_count ?? 0) + 1;
    const t = getTranslations(target.language);
    const amount = formatPrice(r.outstanding, String(r.invoice.currency || "EUR"));
    const response = await send({ from: "Media Marketing <noreply@mediaamarketing.com>", to: [r.recipient], cc: r.cc.length ? r.cc : undefined,
      subject: `💰 ${t.urgency[Math.min(number - 1, 2)]} #${number}: ${t.invoiceLabel} ${r.invoice.invoice_number} - ${amount}`,
      html: buildReminderEmailHtml({ clientName: String(r.invoice.bill_to_name || r.client?.name || r.order?.company_name || "Client"), clientEmail: r.recipient, clientPhone: String(r.client?.phone || r.order?.contact_phone || ""), companyAddress: String(r.client?.address || r.order?.company_address || ""), companyName: String(r.client?.name || r.order?.company_name || "Client"), description: String(r.order?.description || ""), invoiceNumber: r.invoice.invoice_number, amount, reminderNumber: number, language: target.language, isClientEmail: true, isResolved: r.order?.status_resolved === true }),
    });
    if (response.error) { console.error("Assistant reminder delivery failed", response.error); throw new Error(response.error.message); }
    const now = new Date();
    const tracked = await db.from("invoices").update({ reminder_count: number, last_reminder_sent_at: now.toISOString(), next_reminder_at: new Date(now.getTime() + Number(r.invoice.reminder_interval_hours || 168) * 3600000).toISOString() }).eq("id", id);
    if (tracked.error) throw new Error("Email sent, but tracking failed; do not resend");
    const logged = await db.from("invoice_payment_reminders").insert({ invoice_id: id, order_id: r.invoice.order_id || id, reminder_number: number, sent_to_client: [r.recipient, ...r.cc].join(", "), sent_to_team: false });
    if (logged.error) throw new Error("Email sent, but reminder history failed; do not resend");
  });
}

export async function setConfirmedBulkStatus(db: SupabaseClient, args: unknown, userId: string) {
  const a = BulkStatus.parse(args);
  const snapshot = z.object({ targets: z.array(z.object({ id: z.string().uuid(), status: z.string() })) }).parse(args);
  const now = new Date().toISOString();
  return executeBatch(a.ids, async id => {
    const target = snapshot.targets.find(t => t.id === id);
    if (!target) throw new Error("Missing reviewed record");
    const patch: Row = { status: a.status };
    if (a.entity === "orders") Object.assign(patch, { [ORDER_STATUS_COLUMNS[a.status]]: true, status_date: now });
    else if (a.status === "cancelled") Object.assign(patch, { cancelled_at: now, cancelled_by: userId, next_reminder_at: null });
    else if (a.status === "paid") Object.assign(patch, { paid_at: now, next_reminder_at: null });
    let query = db.from(a.entity).update(patch).eq("id", id).eq("status", target.status);
    if (a.entity === "orders") query = query.is("deleted_at", null);
    const changed = must(await query.select("id"));
    if (!changed?.length) throw new Error("Record changed since review; propose again");
    if (a.entity === "orders") {
      if (a.status === "Cancelled") { const synced = await db.rpc("sync_invoice_status_by_order", { p_order_id: id, p_status: "cancelled", p_next_reminder_at: null }); if (synced.error) throw new Error("Order changed, invoice sync failed; check invoice"); }
      const audit = await db.from("order_audit_logs").insert({ order_id: id, action: "status_changed", actor_id: userId, details: `Bulk status set to ${a.status} via admin assistant` });
      if (audit.error) throw new Error("Status changed, audit failed; do not repeat");
    }
  });
}

export async function prepareTicket(db: SupabaseClient, args: unknown) {
  const a = SupportTicket.parse(args);
  const order = must(await db.from("orders").select("id,contact_email,contact_name,company_name,deleted_at").eq("id", a.order_id).maybeSingle());
  if (!order || order.deleted_at) throw new Error("Order not found");
  const address = z.string().email().parse(order.contact_email);
  if (a.client_email && a.client_email.toLowerCase() !== address.toLowerCase()) throw new Error("Ticket email does not match the order");
  return { ...a, client_email: address, client_name: order.contact_name || order.company_name, company_name: order.company_name };
}

export async function claimAssistantAction(db: SupabaseClient, actionId: string, userId: string) {
  const claimed = must(await db.from("assistant_actions").update({ status: "processing", confirmed_by: userId }).eq("id", actionId).eq("user_id", userId).eq("status", "pending").select("id"));
  return Boolean(claimed?.length);
}