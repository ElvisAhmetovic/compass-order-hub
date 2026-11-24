import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { json, requireAdmin } from "../_shared/assistantAuth.ts";
import { ORDER_STATUS_COLUMNS, INVOICE_STATUSES } from "../_shared/assistantRules.ts";
import { InvoiceIds, BulkStatus, SupportTicket, sendConfirmedReminders, setConfirmedBulkStatus, prepareTicket, claimAssistantAction } from "../_shared/assistantOperations.ts";

const Body = z.object({ actionId: z.string().uuid(), decision: z.enum(["confirm", "cancel"]) });
const email = z.string().email().max(255);
const S = {
  create_order: z.object({ company_name: z.string().min(1).max(200), contact_name: z.string().max(200).optional(), contact_email: email, contact_phone: z.string().max(50).optional(), price: z.number().nonnegative().max(1_000_000), currency: z.string().max(3).optional(), description: z.string().max(5000).optional(), internal_notes: z.string().max(5000).optional() }),
  update_order: z.object({ order_id: z.string().uuid(), changes: z.object({ company_name: z.string().max(200).optional(), contact_name: z.string().max(200).optional(), contact_email: email.optional(), contact_phone: z.string().max(50).optional(), price: z.number().nonnegative().optional(), description: z.string().max(5000).optional(), internal_notes: z.string().max(5000).optional(), client_visible_update: z.string().max(5000).optional(), priority: z.string().max(20).optional() }).strict() }),
  set_order_status: z.object({ order_id: z.string().uuid(), status: z.enum(Object.keys(ORDER_STATUS_COLUMNS) as [string, ...string[]]) }),
  set_invoice_status: z.object({ invoice_id: z.string().uuid(), status: z.enum(INVOICE_STATUSES as [string, ...string[]]) }),
  create_follow_up_reminder: z.object({ company_name: z.string().min(1).max(200), note: z.string().min(1).max(2000), remind_at: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)), assignee_email: email, assignee_name: z.string().max(200).optional(), contact_phone: z.string().max(50).optional() }),
  set_ticket_status: z.object({ ticket_id: z.string().uuid(), status: z.enum(["open", "in_progress", "closed"]), notes: z.string().max(5000).optional() }),
  set_contract_status: z.object({ contract_id: z.string().uuid(), status: z.enum(["active", "stopped"]) }),
  create_portal_account: z.object({ email, name: z.string().min(1).max(200), company_name: z.string().max(200).optional() }),
  create_invoice: z.object({ client_id: z.string().uuid(), order_id: z.string().uuid().optional(), due_days: z.number().int().min(0).max(365).optional(), currency: z.string().length(3).optional(), vat_rate: z.number().min(0).max(30).optional(), language: z.enum(["de", "en"]).optional(), notes: z.string().max(5000).optional(), items: z.array(z.object({ description: z.string().min(1).max(500), quantity: z.number().positive().max(10000).optional(), unit_price: z.number().nonnegative().max(1_000_000) })).min(1).max(50) }),
  create_support_ticket: SupportTicket,
  stop_stripe_package: z.object({ contract_id: z.string().uuid() }),
  send_invoice_reminders: InvoiceIds,
  bulk_set_status: BulkStatus,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request" }, 400);
  const { db, userId, auth } = admin;
  const { data: action } = await db.from("assistant_actions").select("*").eq("id", parsed.data.actionId).eq("user_id", userId).maybeSingle();
  if (!action) return json({ error: "Not found" }, 404);
  if (action.status !== "pending") return json({ error: `Already ${action.status}` }, 409);
  const finish = async (status: string, result: unknown) => {
    const { data: saved, error } = await db.from("assistant_actions").update({ status, result, confirmed_by: userId }).eq("id", action.id).in("status", status === "cancelled" ? ["pending"] : ["pending", "processing"]).select("id");
    if (error) return json({ error: "Could not save action outcome. Do not repeat the action." }, 500);
    if (!saved?.length) return json({ error: "Action is already being handled; reload the conversation." }, 409);
    return json({ status, result }, status === "failed" ? 422 : 200);
  };
  if (parsed.data.decision === "cancel") return finish("cancelled", null);

  const schema = S[action.tool as keyof typeof S];
  if (!schema) return finish("failed", { error: "Unknown action" });
  const p = schema.safeParse(action.args);
  if (!p.success) return finish("failed", { error: "Invalid details", details: p.error.flatten().fieldErrors });
  try {
    if (!await claimAssistantAction(db, action.id, userId)) return json({ error: "This action is already being handled" }, 409);
  } catch { return json({ error: "Could not claim the action; nothing was changed" }, 500); }
  const now = new Date().toISOString();
  try {
    switch (action.tool) {
      case "send_invoice_reminders": {
        const results = await sendConfirmedReminders(db, action.args);
        return finish(results.every(r => r.status === "done") ? "confirmed" : "failed", { results, error: results.some(r => r.status !== "done") ? "Some reminders were not sent; review individual results. Do not repeat completed items." : undefined });
      }
      case "bulk_set_status": {
        const results = await setConfirmedBulkStatus(db, action.args, userId);
        return finish(results.every(r => r.status === "done") ? "confirmed" : "failed", { results, error: results.some(r => r.status !== "done") ? "Some records were not changed; review individual results." : undefined });
      }
      case "create_order": {
        const a = S.create_order.parse(action.args);
        const { data, error } = await db.from("orders").insert({ ...a, amount: a.price, currency: a.currency ?? "EUR", status: "Created", status_created: true, created_by: userId }).select("id").single();
        if (error) throw error;
        await db.from("order_audit_logs").insert({ order_id: data.id, action: "created", actor_id: userId, details: "Created via admin assistant" });
        // New orders get a client portal account (existing rule) — fire and forget.
        fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ensure-client-portal`, { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ email: a.contact_email, name: a.contact_name ?? a.company_name, companyName: a.company_name, orderId: data.id }) }).catch(() => {});
        return finish("confirmed", { order_id: data.id, link: `/dashboard?order=${data.id}` });
      }
      case "update_order": {
        const a = S.update_order.parse(action.args);
        const ch = { ...a.changes, ...(a.changes.price !== undefined ? { amount: a.changes.price } : {}), updated_at: now };
        const { data, error } = await db.from("orders").update(ch).eq("id", a.order_id).select("id");
        if (error) throw error;
        if (!data?.length) return finish("failed", { error: "Order not found" });
        await db.from("order_audit_logs").insert({ order_id: a.order_id, action: "updated", actor_id: userId, details: `Updated via admin assistant: ${Object.keys(a.changes).join(", ")}` });
        return finish("confirmed", { order_id: a.order_id });
      }
      case "set_order_status": {
        const a = S.set_order_status.parse(action.args);
        const col = ORDER_STATUS_COLUMNS[a.status];
        const { data, error } = await db.from("orders").update({ status: a.status, [col]: true, status_date: now }).eq("id", a.order_id).select("id");
        if (error) throw error;
        if (!data?.length) return finish("failed", { error: "Order not found" });
        if (a.status === "Cancelled") await db.rpc("sync_invoice_status_by_order", { p_order_id: a.order_id, p_status: "cancelled", p_next_reminder_at: null });
        await db.from("order_audit_logs").insert({ order_id: a.order_id, action: "status_changed", actor_id: userId, details: `Status set to ${a.status} via admin assistant` });
        return finish("confirmed", { order_id: a.order_id, status: a.status });
      }
      case "set_invoice_status": {
        const a = S.set_invoice_status.parse(action.args);
        const patch: Record<string, unknown> = { status: a.status };
        if (a.status === "cancelled") Object.assign(patch, { cancelled_at: now, cancelled_by: userId });
        const { data, error } = await db.from("invoices").update(patch).eq("id", a.invoice_id).select("id,invoice_number");
        if (error) throw error;
        if (!data?.length) return finish("failed", { error: "Invoice not found" });
        return finish("confirmed", { invoice: data[0].invoice_number, status: a.status });
      }
      case "create_follow_up_reminder": {
        const a = S.create_follow_up_reminder.parse(action.args);
        const { data, error } = await db.from("follow_up_reminders").insert({ ...a, remind_at: new Date(a.remind_at).toISOString(), created_by: userId }).select("id").single();
        if (error) throw error;
        return finish("confirmed", { reminder_id: data.id });
      }
      case "set_ticket_status": {
        const a = S.set_ticket_status.parse(action.args);
        const { data, error } = await db.from("customer_tickets").update({ status: a.status, ...(a.notes ? { notes: a.notes } : {}) }).eq("id", a.ticket_id).select("id");
        if (error) throw error;
        if (!data?.length) return finish("failed", { error: "Ticket not found" });
        return finish("confirmed", { ticket_id: a.ticket_id, status: a.status });
      }
      case "set_contract_status": {
        const a = S.set_contract_status.parse(action.args);
        const { data: c } = await db.from("monthly_contracts").select("id,stripe_subscription_id").eq("id", a.contract_id).maybeSingle();
        if (!c) return finish("failed", { error: "Package not found" });
        if (c.stripe_subscription_id) return finish("failed", { error: "This package is billed by Stripe. Cancel or resume it from Monthly Packages." });
        const patch = a.status === "stopped" ? { status: "stopped", stopped_at: now, stopped_reason: "Stopped via admin assistant" } : { status: "active", stopped_at: null, stopped_reason: null };
        const { error } = await db.from("monthly_contracts").update(patch).eq("id", a.contract_id);
        if (error) throw error;
        return finish("confirmed", { contract_id: a.contract_id, status: a.status });
      }
      case "create_portal_account": {
        const a = S.create_portal_account.parse(action.args);
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ensure-client-portal`, { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ email: a.email, name: a.name, companyName: a.company_name }) });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) return finish("failed", out);
        return finish("confirmed", out);
      }
      case "create_invoice": {
        const a = S.create_invoice.parse(action.args);
        const { data: client } = await db.from("clients").select("id,name,email").eq("id", a.client_id).maybeSingle();
        if (!client) return finish("failed", { error: "Client not found" });
        const issue = new Date(); const due = new Date(issue); due.setDate(due.getDate() + (a.due_days ?? 14));
        const vat = a.vat_rate ?? 0;
        let inv: { id: string; invoice_number: string } | null = null;
        for (let attempt = 0; attempt < 5 && !inv; attempt++) {
          const { data: num, error: nErr } = await db.rpc("generate_invoice_number", { prefix_param: "INV" });
          if (nErr) throw nErr;
          const { data, error } = await db.from("invoices").insert({ invoice_number: num, client_id: client.id, order_id: a.order_id ?? null, issue_date: issue.toISOString().slice(0, 10), due_date: due.toISOString().slice(0, 10), currency: a.currency ?? "EUR", language: a.language ?? "de", vat_enabled: vat > 0, vat_rate_default: vat, payment_terms: `Net ${a.due_days ?? 14}`, notes: a.notes ?? null, status: "draft", user_id: userId }).select("id,invoice_number").single();
          if (error) { if (error.code === "23505" && String(error.message).includes("invoice_number")) continue; throw error; }
          inv = data;
        }
        if (!inv) return finish("failed", { error: "Could not get a free invoice number" });
        const invoiceId = inv.id;
        const { error: liErr } = await db.from("invoice_line_items").insert(a.items.map((i: { description: string; quantity?: number; unit_price: number }) => ({ invoice_id: invoiceId, item_description: i.description, quantity: i.quantity ?? 1, unit: "pcs", unit_price: i.unit_price, vat_rate: vat, discount_rate: 0 })));
        if (liErr) throw liErr;
        await db.rpc("recalculate_invoice_totals", { p_invoice_id: inv.id }).then(() => {}, () => {});
        return finish("confirmed", { invoice_id: inv.id, invoice_number: inv.invoice_number });
      }
      case "create_support_ticket": {
        const details = await prepareTicket(db, action.args);
        const { data, error } = await db.from("customer_tickets").insert({ ...details, status: "open" }).select("id").single();
        if (error) throw error;
        return finish("confirmed", { ticket_id: data.id });
      }
      case "stop_stripe_package": {
        const a = S.stop_stripe_package.parse(action.args);
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe-billing`, { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", contract_id: a.contract_id }) });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) return finish("failed", out);
        return finish("confirmed", { contract_id: a.contract_id, ...out });
      }
    }
  } catch (e) {
    console.error("confirm failed", e);
    return finish("failed", { error: (e as { message?: string }).message ?? "Failed" });
  }
  return finish("failed", { error: "Unknown action" });
});
