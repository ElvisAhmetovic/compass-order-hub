import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { SupabaseClient, createClient } from "npm:@supabase/supabase-js@2";
import { berlinDayWindow, packageEnd, reminderEligibility, BulkStatus, InvoiceIds, dailyBriefing, clientSummary, prepareReminders, prepareBulk, prepareTicket, executeBatch, setConfirmedBulkStatus, sendConfirmedReminders, claimAssistantAction } from "../_shared/assistantOperations.ts";
import { requireAdmin, requireReminderCaller, json } from "../_shared/assistantAuth.ts";
import { needsConfirmation } from "../_shared/assistantRules.ts";

type Row = Record<string, unknown>;
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const now = new Date("2026-11-24T13:48:00Z");
const unpaid: Row = { id: id(1), invoice_number: "INV-2026-1", status: "sent", due_date: "2026-11-01T00:00:00Z", total_amount: 100, currency: "EUR", bill_to_email: "invoice+qa@mediaamarketing.com", language: "de" };

// An in-memory query adapter: these tests cannot contact or mutate live data.
function fakeDb(data: Record<string, Row[]>, failures: string[] = []) {
  const writes: Row[] = [];
  const calls: Row[] = [];
  class Query implements PromiseLike<{ data: Row[] | Row | null; error: { message: string } | null; count: number }> {
    filters: ((row: Row) => boolean)[] = [];
    first = 0; last = Infinity; single = false; patch: Row | null = null; inserted: Row | null = null; columns = "*";
    constructor(readonly table: string) {}
    select(columns = "*") { this.columns = columns; return this; }
    returns<T>() { return this; }
    eq(column: string, value: unknown) { this.filters.push(row => row[column] === value); return this; }
    is(column: string, value: unknown) { this.filters.push(row => (row[column] ?? null) === value); return this; }
    in(column: string, values: unknown[]) { this.filters.push(row => values.includes(row[column])); return this; }
    ilike(column: string, value: string) { this.filters.push(row => String(row[column] ?? "").toLowerCase() === value.toLowerCase()); return this; }
    or() { return this; }
    lt(column: string, value: string) { this.filters.push(row => String(row[column]) < value); return this; }
    order() { return this; }
    limit(n: number) { this.last = n - 1; return this; }
    range(first: number, last: number) { this.first = first; this.last = last; return this; }
    maybeSingle() { this.single = true; return this; }
    update(patch: Row) { this.patch = patch; return this; }
    insert(row: Row) { this.inserted = row; return this; }
    then<TResult1 = { data: Row[] | Row | null; error: { message: string } | null; count: number }, TResult2 = never>(resolve?: ((value: { data: Row[] | Row | null; error: { message: string } | null; count: number }) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
      if (failures.includes(this.table)) return Promise.resolve({ data: null, count: 0, error: { message: `${this.table} unavailable` } }).then(resolve, reject);
      if (this.inserted) { writes.push({ table: this.table, ...this.inserted }); (data[this.table] ??= []).push(this.inserted); }
      const matching = (data[this.table] ?? []).filter(row => this.filters.every(f => f(row)));
      if (this.patch) for (const row of matching) { writes.push({ table: this.table, id: row.id, ...this.patch }); Object.assign(row, this.patch); }
      const selected = matching.slice(this.first, this.last + 1).map(row => this.columns === "*" ? row : Object.fromEntries(this.columns.split(",").map(key => [key, row[key]])));
      return Promise.resolve({ data: this.single ? selected[0] ?? null : selected, count: matching.length, error: null }).then(resolve, reject);
    }
  }
  const db = { from: (table: string) => new Query(table), rpc: (name: string, args: Row) => { calls.push({ name, ...args }); return Promise.resolve({ error: failures.includes("rpc") ? { message: "sync failed" } : null, data: null }); } } as unknown as SupabaseClient;
  return { db, writes, calls };
}

Deno.test("Berlin briefing includes local midnight rather than UTC midnight", () => {
  assertEquals(berlinDayWindow(new Date("2026-11-23T23:30:00Z")), { date: "2026-11-24", start: "2026-11-23T23:00:00.000Z", end: "2026-11-24T23:00:00.000Z" });
  assertEquals(berlinDayWindow(new Date("2026-03-29T12:00:00Z")).end, "2026-03-29T22:00:00.000Z");
});
Deno.test("package month-end is clamped and Stripe end date takes precedence", () => {
  assertEquals(packageEnd({ start_date: "2026-01-31", duration_months: 1 }), "2026-02-28T00:00:00.000Z");
  assertEquals(packageEnd({ start_date: "2026-01-31", duration_months: 1, stripe_ends_at: "2026-12-10T00:00:00Z" }), "2026-12-10T00:00:00Z");
});
for (const [name, invoice, order, client, paid] of [
  ["paid", { ...unpaid, status: "paid" }, null, null, 0],
  ["cancelled", { ...unpaid, status: "cancelled" }, null, null, 0],
  ["not due", { ...unpaid, due_date: "2026-12-01" }, null, null, 0],
  ["paused", { ...unpaid, reminders_paused: true }, null, null, 0],
  ["client opt-out", unpaid, null, { auto_reminders_enabled: false }, 0],
  ["deleted order", unpaid, { deleted_at: "2026-11-20" }, null, 0],
  ["paid order", unpaid, { status: "Invoice Paid" }, null, 0],
  ["cancelled order", unpaid, { status: "Cancelled" }, null, 0],
  ["covered by payments", unpaid, null, null, 100],
] as [string, Row, Row | null, Row | null, number][]) {
  Deno.test(`reminders reject ${name}`, () => { assertEquals(reminderEligibility(invoice, order, client, paid, now) !== null, true); });
}
Deno.test("partially paid overdue invoice remains eligible", () => { assertEquals(reminderEligibility(unpaid, null, null, 40, now), null); });
Deno.test("bulk changes and reminder batches always require Confirm; maximum 20 distinct IDs", () => {
  assertEquals(needsConfirmation("bulk_set_status"), true);
  assertEquals(needsConfirmation("send_invoice_reminders"), true);
  assertEquals(needsConfirmation("daily_briefing"), false);
  assertEquals(InvoiceIds.safeParse({ invoice_ids: Array.from({ length: 20 }, (_, i) => id(i)) }).success, true);
  assertEquals(InvoiceIds.safeParse({ invoice_ids: Array.from({ length: 21 }, (_, i) => id(i)) }).success, false);
  assertEquals(InvoiceIds.safeParse({ invoice_ids: [id(1), id(1)] }).success, false);
  assertEquals(BulkStatus.safeParse({ entity: "invoices", ids: [id(1)], status: "In Progress" }).success, false);
});
Deno.test("daily briefing counts beyond sample and reads without writes", async () => {
  const f = fakeDb({ invoices: Array.from({ length: 12 }, (_, i) => ({ ...unpaid, id: id(i) })), customer_tickets: [{ id: id(100), status: "open" }], follow_up_reminders: [{ id: id(101), status: "pending", remind_at: "2026-11-24T15:00:00Z" }], monthly_contracts: [{ id: id(102), status: "active", start_date: "2026-11-01", duration_months: 1 }] });
  const result = await dailyBriefing(f.db, "staff@example.com", now);
  assertEquals(result.overdue_invoices.count, 12); assertEquals(result.overdue_invoices.rows?.length, 8);
  assertEquals(result.packages_ending_within_30_days.count, 1); assertEquals(result.reminders_due.count, 1);
  assertEquals(f.writes.length, 0); assertEquals(result.finance_totals_available, false);
});
Deno.test("briefing lookup failure is surfaced, not an empty list", async () => {
  await assertRejects(() => dailyBriefing(fakeDb({}, ["invoices"]).db, null, now), Error, "invoices unavailable");
});
Deno.test("client summary paginates, deduplicates invoices and guards owner balances", async () => {
  const client = { id: id(2000), name: "QA", email: "invoice+qa@mediaamarketing.com" };
  const data = { clients: [client], orders: Array.from({ length: 1001 }, (_, i) => ({ id: id(i), contact_email: client.email, price: 500, amount: 500, created_at: "2026-11-01" })), invoices: [{ ...unpaid, client_id: client.id, order_id: id(1) }], payments: [{ id: id(2001), invoice_id: id(1), amount: 40 }] };
  const f = fakeDb(data);
  const owner = await clientSummary(f.db, "business@team-abmedia.com", { client_id: client.id });
  if (!("orders" in owner)) throw new Error("Expected identified client summary");
  if (!("outstanding_by_currency" in owner)) throw new Error("Expected owner balance");
  assertEquals(owner.orders?.count, 1001); assertEquals(owner.invoices?.count, 1); assertEquals(owner.outstanding_by_currency, { EUR: 60 });
  const staff = await clientSummary(f.db, "staff@example.com", { client_id: client.id });
  if (!("orders" in staff)) throw new Error("Expected identified client summary");
  assertEquals("outstanding_by_currency" in staff, false); assertEquals(staff.orders?.rows[0].price, undefined); assertEquals(staff.invoices?.rows[0].total_amount, undefined);
});
Deno.test("ambiguous client name requires a choice", async () => {
  const f = fakeDb({ clients: [{ id: id(1), name: "Smith" }, { id: id(2), name: "Smith" }] });
  assertEquals((await clientSummary(f.db, null, { query: "Smith" })).candidates?.length, 2);
});
Deno.test("reminder proposal records recipient and CC without sending or mutating", async () => {
  const f = fakeDb({ invoices: [{ ...unpaid, cc_emails: ["INVOICE@mediaamarketing.com", unpaid.bill_to_email] }] });
  const p = await prepareReminders(f.db, { invoice_ids: [id(1)] }, "staff@example.com");
  assertEquals(p.targets[0].recipient, unpaid.bill_to_email); assertEquals(p.targets[0].cc, ["invoice@mediaamarketing.com"]); assertEquals(p.targets[0].outstanding, undefined); assertEquals(f.writes.length, 0);
});
Deno.test("matched recipient opt-out prevents reminder proposal", async () => {
  const f = fakeDb({ invoices: [unpaid], clients: [{ email: unpaid.bill_to_email, auto_reminders_enabled: false }] });
  await assertRejects(() => prepareReminders(f.db, { invoice_ids: [id(1)] }, null), Error, "disabled");
});
Deno.test("bulk review names targets without writes, cancellation synchronizes invoice", async () => {
  const f = fakeDb({ orders: [{ id: id(1), company_name: "QA", status: "Created" }] });
  const proposal = await prepareBulk(f.db, { entity: "orders", ids: [id(1)], status: "Cancelled" });
  assertEquals(proposal.targets[0]?.company_name, "QA"); assertEquals(f.writes.length, 0);
  const result = await setConfirmedBulkStatus(f.db, proposal, id(2));
  assertEquals(result[0].status, "done"); assertEquals(f.calls[0].p_status, "cancelled"); assertEquals(f.calls[0].p_order_id, id(1));
});
Deno.test("bulk ignores records changed after review and reports partial failures", async () => {
  const f = fakeDb({ invoices: [{ id: id(1), status: "sent" }, { id: id(2), status: "cancelled" }] });
  const result = await setConfirmedBulkStatus(f.db, { entity: "invoices", ids: [id(1), id(2)], status: "paid", targets: [{ id: id(1), status: "sent" }, { id: id(2), status: "sent" }] }, id(3));
  assertEquals(result.map(r => r.status), ["done", "failed"]); assertEquals(f.writes.filter(w => w.id === id(2)).length, 0);
});
Deno.test("a batch continues after an individual failure", async () => {
  const completed: string[] = [];
  const results = await executeBatch([id(1), id(2)], async key => { if (key === id(1)) throw new Error("Paid since review"); completed.push(key); });
  assertEquals(results.map(r => r.status), ["failed", "done"]); assertEquals(completed, [id(2)]);
});
Deno.test("new tickets use the linked order contact and reject mismatched email", async () => {
  const f = fakeDb({ orders: [{ id: id(1), company_name: "QA", contact_email: "invoice+qa@mediaamarketing.com" }] });
  const p = await prepareTicket(f.db, { order_id: id(1), subject: "Website problem" });
  assertEquals(p.client_email, "invoice+qa@mediaamarketing.com"); assertEquals(f.writes.length, 0);
  await assertRejects(() => prepareTicket(f.db, { order_id: id(1), subject: "Problem", client_email: "other@example.com" }), Error, "does not match");
});
Deno.test("assistant callers without authorization receive 401", async () => {
  const r = await requireAdmin(new Request("http://localhost")); assertEquals(r instanceof Response && r.status, 401);
});
Deno.test("non-admin authenticated caller receives 403", async () => {
  const fake = (() => ({ auth: { getClaims: () => Promise.resolve({ data: { claims: { sub: id(1), email: "client@example.com" } }, error: null }) }, from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [{ role: "client" }], error: null }) }) }) })) as unknown as typeof createClient;
  const r = await requireAdmin(new Request("http://localhost", { headers: { Authorization: "Bearer fake-test-token" } }), fake);
  assertEquals(r instanceof Response && r.status, 403);
});

Deno.test("automatic reminders require scheduler credential or verified admin", async () => {
  const denied = async () => json({ error: "Forbidden" }, 403);
  assertEquals(await requireReminderCaller(new Request("http://localhost", { headers: { Authorization: "Bearer fake-scheduler-test" } }), denied, "fake-scheduler-test"), null);
  const r = await requireReminderCaller(new Request("http://localhost", { headers: { Authorization: "Bearer wrong-test-token" } }), denied, "fake-scheduler-test");
  assertEquals(r?.status, 403);
  assertEquals((await requireReminderCaller(new Request("http://localhost")))?.status, 401);
});

Deno.test("scheduled reminder job is accepted only with the correct vault pass", async () => {
  const unauth = async () => json({ error: "Unauthorized" }, 401);
  const check = async (s: string) => s === "right-pass-test";
  const req = (h: Record<string, string>) => new Request("http://localhost", { headers: h });
  assertEquals(await requireReminderCaller(req({ "x-cron-secret": "right-pass-test" }), unauth, "fake-scheduler-test", check), null);
  assertEquals((await requireReminderCaller(req({ "x-cron-secret": "wrong-pass-test" }), unauth, "fake-scheduler-test", check))?.status, 401);
  // the public website key alone is not enough
  assertEquals((await requireReminderCaller(req({ Authorization: "Bearer public-key-test" }), unauth, "fake-scheduler-test", check))?.status, 401);
});

Deno.test("a pending action can be claimed once and only by its owner", async () => {
  const f = fakeDb({ assistant_actions: [{ id: id(1), user_id: id(2), status: "pending" }] });
  assertEquals(await claimAssistantAction(f.db, id(1), id(3)), false);
  assertEquals(await claimAssistantAction(f.db, id(1), id(2)), true);
  assertEquals(await claimAssistantAction(f.db, id(1), id(2)), false);
});

Deno.test("confirmed reminder sends remaining balance and records delivery", async () => {
  const f = fakeDb({ invoices: [{ ...unpaid }], payments: [{ id: id(2), invoice_id: id(1), amount: 40 }] });
  const proposal = await prepareReminders(f.db, { invoice_ids: [id(1)] }, "business@team-abmedia.com");
  assertEquals(proposal.targets[0].outstanding, 60);
  let sent = 0;
  const results = await sendConfirmedReminders(f.db, proposal, async message => { sent++; assertEquals(message.to, [unpaid.bill_to_email]); return { error: null }; });
  assertEquals(sent, 1); assertEquals(results[0].status, "done");
  assertEquals(f.writes.find(w => w.table === "invoices")?.reminder_count, 1);
  assertEquals(f.writes.find(w => w.table === "invoice_payment_reminders")?.sent_to_client, unpaid.bill_to_email);
});

Deno.test("invoice paid between proposal and Confirm is never emailed", async () => {
  const data = { invoices: [{ ...unpaid }] };
  const f = fakeDb(data);
  const proposal = await prepareReminders(f.db, { invoice_ids: [id(1)] }, null);
  data.invoices[0].status = "paid";
  let sent = 0;
  const results = await sendConfirmedReminders(f.db, proposal, async () => { sent++; return { error: null }; });
  assertEquals(results[0].status, "failed"); assertEquals(sent, 0); assertEquals(f.writes.length, 0);
});

Deno.test("changed recipient after review is never emailed", async () => {
  const data = { invoices: [{ ...unpaid }] };
  const f = fakeDb(data);
  const proposal = await prepareReminders(f.db, { invoice_ids: [id(1)] }, null);
  data.invoices[0].bill_to_email = "other@example.com";
  let sent = 0;
  const results = await sendConfirmedReminders(f.db, proposal, async () => { sent++; return { error: null }; });
  assertEquals(results[0].status, "failed"); assertEquals(sent, 0);
});

Deno.test("delivery failure does not advance reminder tracking", async () => {
  const f = fakeDb({ invoices: [{ ...unpaid }] });
  const proposal = await prepareReminders(f.db, { invoice_ids: [id(1)] }, null);
  const results = await sendConfirmedReminders(f.db, proposal, async () => ({ error: { message: "Delivery refused" } }));
  assertEquals(results[0].status, "failed"); assertEquals(f.writes.length, 0);
});