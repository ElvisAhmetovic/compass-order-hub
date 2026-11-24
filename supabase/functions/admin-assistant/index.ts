import { generateResponse } from "npm:@lovable.dev/ai-gateway";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { json, requireAdmin } from "../_shared/assistantAuth.ts";
import { READ_TABLES, WRITE_TOOLS, needsConfirmation, moneyBlocked, safeColumns, ORDER_STATUS_COLUMNS, INVOICE_STATUSES } from "../_shared/assistantRules.ts";

const Body = z.object({ threadId: z.string().uuid(), message: z.string().min(1).max(4000) });
const tables = Object.keys(READ_TABLES);
const filterSchema = { type: "object", description: "Exact-match filters, column -> value", additionalProperties: { type: ["string", "number", "boolean"] } };
const range = { date_from: { type: "string", description: "ISO date, inclusive" }, date_to: { type: "string", description: "ISO date, exclusive" } };

const TOOLS = [
  { type: "function", name: "count_records", description: "Count rows in a table, optionally filtered and limited to a date range on the table's main date.", parameters: { type: "object", properties: { table: { type: "string", enum: tables }, filters: filterSchema, ...range }, required: ["table"] } },
  { type: "function", name: "sum_field", description: "Sum a money column (owner-only for money).", parameters: { type: "object", properties: { table: { type: "string", enum: tables }, field: { type: "string" }, filters: filterSchema, ...range }, required: ["table", "field"] } },
  { type: "function", name: "search_records", description: "Find rows (max 50). 'text' searches names/emails/descriptions.", parameters: { type: "object", properties: { table: { type: "string", enum: tables }, text: { type: "string" }, filters: filterSchema, columns: { type: "array", items: { type: "string" } }, limit: { type: "number" }, ...range }, required: ["table"] } },
  { type: "function", name: "create_order", description: "PROPOSE a new order (needs admin Confirm).", parameters: { type: "object", properties: { company_name: { type: "string" }, contact_name: { type: "string" }, contact_email: { type: "string" }, contact_phone: { type: "string" }, price: { type: "number" }, currency: { type: "string" }, description: { type: "string" }, internal_notes: { type: "string" } }, required: ["company_name", "contact_email", "price"] } },
  { type: "function", name: "update_order", description: "PROPOSE editing order fields.", parameters: { type: "object", properties: { order_id: { type: "string" }, changes: { type: "object", properties: { company_name: { type: "string" }, contact_name: { type: "string" }, contact_email: { type: "string" }, contact_phone: { type: "string" }, price: { type: "number" }, description: { type: "string" }, internal_notes: { type: "string" }, client_visible_update: { type: "string" }, priority: { type: "string" } } } }, required: ["order_id", "changes"] } },
  { type: "function", name: "set_order_status", description: "PROPOSE changing an order status.", parameters: { type: "object", properties: { order_id: { type: "string" }, status: { type: "string", enum: Object.keys(ORDER_STATUS_COLUMNS) } }, required: ["order_id", "status"] } },
  { type: "function", name: "set_invoice_status", description: "PROPOSE changing an invoice status.", parameters: { type: "object", properties: { invoice_id: { type: "string" }, status: { type: "string", enum: INVOICE_STATUSES } }, required: ["invoice_id", "status"] } },
  { type: "function", name: "create_follow_up_reminder", description: "PROPOSE a follow-up reminder for a team member.", parameters: { type: "object", properties: { company_name: { type: "string" }, note: { type: "string" }, remind_at: { type: "string", description: "ISO datetime" }, assignee_email: { type: "string" }, assignee_name: { type: "string" }, contact_phone: { type: "string" } }, required: ["company_name", "note", "remind_at", "assignee_email"] } },
  { type: "function", name: "set_ticket_status", description: "PROPOSE changing a support ticket status (open, in_progress, closed) and optionally its notes.", parameters: { type: "object", properties: { ticket_id: { type: "string" }, status: { type: "string", enum: ["open", "in_progress", "closed"] }, notes: { type: "string" } }, required: ["ticket_id", "status"] } },
  { type: "function", name: "set_contract_status", description: "PROPOSE stopping or reactivating a monthly package (not for Stripe-billed packages).", parameters: { type: "object", properties: { contract_id: { type: "string" }, status: { type: "string", enum: ["active", "stopped"] } }, required: ["contract_id", "status"] } },
  { type: "function", name: "create_portal_account", description: "PROPOSE creating a client portal account (only if none exists; never resets passwords).", parameters: { type: "object", properties: { email: { type: "string" }, name: { type: "string" }, company_name: { type: "string" } }, required: ["email", "name"] } },
];

const today = () => new Date().toISOString().slice(0, 10);
const INSTRUCTIONS = () => `You are the internal admin assistant for the Media Marketing CRM (never write LTD/Limited). Today is ${today()} (Europe/Berlin). Answer in the admin's language. Always use tools to get real numbers; never guess or invent data. Prices use European format (e.g. €399,99). Order rows with deleted_at set are deleted: exclude them for orders by adding filters is not possible, so mention it if relevant. For changes you can only PROPOSE with a tool; tell the admin to review and click Confirm on the card. You cannot delete records, refund or cancel Stripe payments, send outreach, or change users/permissions — say so if asked. You cannot generate PDFs: tell the admin to open the invoice in Invoices and use Download PDF. When a tool returns {blocked}, explain that money totals are owner-only. Keep answers short, use markdown tables for lists.`;

type Ctx = { db: Awaited<ReturnType<typeof requireAdmin>> extends infer T ? T extends Response ? never : T : never; threadId: string };
type Args = Record<string, unknown>;

// deno-lint-ignore no-explicit-any
function applyFilters(q: any, table: string, a: Args) {
  const t = READ_TABLES[table];
  const f = (a.filters ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(f)) if (t.cols[0] === "*" || t.cols.includes(k)) q = q.eq(k, v);
  if (a.date_from) q = q.gte(t.date, String(a.date_from));
  if (a.date_to) q = q.lt(t.date, String(a.date_to));
  if (table === "orders" && !("deleted_at" in f)) q = q.is("deleted_at", null);
  return q;
}

async function runTool(name: string, a: Args, ctx: Ctx): Promise<unknown> {
  const { db, email, userId } = ctx.db;
  if (needsConfirmation(name)) {
    const summary = summarize(name, a);
    const { data, error } = await db.from("assistant_actions").insert({ thread_id: ctx.threadId, user_id: userId, tool: name, args: a, summary }).select("id").single();
    if (error) return { error: error.message };
    return { proposed: true, action_id: data.id, summary, note: "Waiting for the admin to click Confirm." };
  }
  const table = String(a.table ?? "");
  if (!READ_TABLES[table]) return { error: "Unknown table" };
  if (name === "count_records") {
    const { count, error } = await applyFilters(db.from(table).select("id", { count: "exact", head: true }), table, a);
    return error ? { error: error.message } : { count };
  }
  if (name === "sum_field") {
    const field = String(a.field);
    if (!READ_TABLES[table].cols.includes(field)) return { error: "Unknown field" };
    if (moneyBlocked(table, field, email)) return { blocked: "Money totals are only visible to the owners." };
    let total = 0, n = 0;
    for (let from = 0; ; from += 1000) {
      const { data, error } = await applyFilters(db.from(table).select(field), table, a).range(from, from + 999);
      if (error) return { error: error.message };
      for (const r of data as Record<string, number | null>[]) { total += Number(r[field] ?? 0); n++; }
      if (data.length < 1000) break;
    }
    return { sum: Math.round(total * 100) / 100, rows: n };
  }
  if (name === "search_records") {
    let cols = safeColumns(table, a.columns as string[] | undefined);
    const money = READ_TABLES[table].money ?? [];
    if (money.some((m) => moneyBlocked(table, m, email))) cols = cols.filter((c) => !money.includes(c) || table === "orders" || table === "offers");
    let q = applyFilters(db.from(table).select(cols.join(",")), table, a);
    const text = String(a.text ?? "").replace(/[,()%]/g, " ").trim();
    const s = READ_TABLES[table].search;
    if (text && s.length) q = q.or(s.map((c) => `${c}.ilike.%${text}%`).join(","));
    const { data, error } = await q.order(READ_TABLES[table].date, { ascending: false }).limit(Math.min(Number(a.limit ?? 20), 50));
    return error ? { error: error.message } : { rows: data };
  }
  return { error: "Unknown tool" };
}

function summarize(tool: string, a: Args): string {
  const c = (a.changes ?? {}) as Args;
  switch (tool) {
    case "create_order": return `Create order for ${a.company_name} (${a.contact_email}), €${a.price}${a.description ? ` – ${a.description}` : ""}`;
    case "update_order": return `Update order ${a.order_id}: ${Object.entries(c).map(([k, v]) => `${k} → ${v}`).join(", ")}`;
    case "set_order_status": return `Set order ${a.order_id} status to ${a.status}`;
    case "set_invoice_status": return `Set invoice ${a.invoice_id} status to ${a.status}`;
    case "create_follow_up_reminder": return `Reminder for ${a.assignee_email} on ${a.remind_at}: ${a.company_name} – ${a.note}`;
    case "set_ticket_status": return `Set ticket ${a.ticket_id} to ${a.status}`;
    case "set_contract_status": return `Set monthly package ${a.contract_id} to ${a.status}`;
    case "create_portal_account": return `Create portal account for ${a.name} (${a.email})`;
  }
  return tool;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { threadId, message } = parsed.data;
  const { db, userId } = admin;
  const { data: thread } = await db.from("assistant_threads").select("id,title").eq("id", threadId).eq("user_id", userId).maybeSingle();
  if (!thread) return json({ error: "Thread not found" }, 404);

  const { error: insErr } = await db.from("assistant_messages").insert({ thread_id: threadId, user_id: userId, role: "user", content: message });
  if (insErr) return json({ error: insErr.message }, 500);
  if (thread.title === "New chat") await db.from("assistant_threads").update({ title: message.slice(0, 60) }).eq("id", threadId);

  const { data: hist } = await db.from("assistant_messages").select("role,content").eq("thread_id", threadId).order("created_at", { ascending: false }).limit(30);
  // deno-lint-ignore no-explicit-any
  const input: any[] = (hist ?? []).reverse().map((m) => ({ role: m.role, content: m.content }));
  const ctx: Ctx = { db: admin, threadId };
  const trace: { tool: string; args: Args; result: unknown }[] = [];
  const actions: string[] = [];
  let text = "";
  try {
    for (let step = 0; step < 8; step++) {
      const res = await generateResponse({ model: "openai/gpt-6-astra", reasoning: { effort: "low" }, instructions: INSTRUCTIONS(), input, tools: TOOLS } as never);
      // deno-lint-ignore no-explicit-any
      const output: any[] = (res as any).output ?? [];
      const calls = output.filter((o) => o.type === "function_call");
      if (!calls.length) {
        text = output.flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text).join("\n");
        break;
      }
      input.push(...output);
      for (const call of calls) {
        let args: Args = {};
        try { args = JSON.parse(call.arguments || "{}"); } catch { /* empty */ }
        const result = await runTool(call.name, args, ctx);
        trace.push({ tool: call.name, args, result });
        const r = result as { action_id?: string };
        if (r.action_id) actions.push(r.action_id);
        input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result).slice(0, 20000) });
      }
    }
  } catch (e) {
    console.error("assistant error", e);
    return json({ error: "The AI service failed. Please try again." }, 502);
  }
  if (!text) text = actions.length ? "Please review the proposed change below." : "Sorry, I couldn't finish that.";
  const parts = { trace: trace.map((t) => ({ tool: t.tool, args: t.args, result: JSON.stringify(t.result).slice(0, 3000) })), actions };
  const { error: aErr } = await db.from("assistant_messages").insert({ thread_id: threadId, user_id: userId, role: "assistant", content: text, parts });
  if (aErr) return json({ error: aErr.message }, 500);
  await db.from("assistant_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
  return json({ text, parts });
});

export { WRITE_TOOLS };
