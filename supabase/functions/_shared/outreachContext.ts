// Loads everything we know about one client so the AI understands the full picture.
// deno-lint-ignore-file no-explicit-any
import type { OutreachOrder } from "./outreachDraft.ts";

export const ORDER_COLS = "id, contact_email, company_name, company_address, description, internal_notes, status, price, amount, currency, created_at, contact_name, assigned_to_name";

export type ClientContext = {
  invoices: string; contracts: string; outreach: string; catalog: string[];
};

export async function loadCatalog(db: any): Promise<string[]> {
  const [{ data: cat }, { data: ins }] = await Promise.all([
    db.from("service_catalog").select("name, description, typical_price").eq("active", true).limit(100),
    db.from("service_insights").select("service_name, display_name").eq("hidden", false).order("order_count", { ascending: false }).limit(30),
  ]);
  const manual = (cat ?? []).map((s: any) => `${s.name}${s.description ? ` – ${s.description}` : ""}${s.typical_price ? ` (typical price as listed by us: ${s.typical_price})` : ""}`);
  const learned = (ins ?? []).map((s: any) => s.display_name || s.service_name);
  return [...manual, ...learned.filter((l: string) => !manual.some((m: string) => m.toLowerCase().startsWith(l.toLowerCase())))];
}

export async function loadClientContext(db: any, email: string, orderIds: string[]): Promise<Omit<ClientContext, "catalog">> {
  const { data: cl } = await db.from("clients").select("id").ilike("email", email);
  const clientIds = (cl ?? []).map((c: any) => c.id);
  const ors = [`bill_to_email.ilike.${email}`];
  if (clientIds.length) ors.push(`client_id.in.(${clientIds.join(",")})`);
  if (orderIds.length) ors.push(`order_id.in.(${orderIds.slice(0, 50).join(",")})`);
  const [{ data: inv }, { data: mc }, { data: od }] = await Promise.all([
    db.from("invoices").select("invoice_number, status, total_amount, currency, due_date, paid_at, created_at").or(ors.join(",")).order("created_at", { ascending: false }).limit(15),
    db.from("monthly_contracts").select("description, website, monthly_amount, currency, billing_frequency, status, start_date, stopped_at, stopped_reason").ilike("client_email", email).limit(10),
    db.from("outreach_drafts").select("status, subject, created_at, sent_at").eq("email", email).order("created_at", { ascending: false }).limit(5),
  ]);
  return {
    invoices: (inv ?? []).map((i: any) => `- ${i.invoice_number}: ${i.status}${i.paid_at ? ` (paid ${String(i.paid_at).slice(0, 10)})` : ""}, ${i.total_amount} ${i.currency || "EUR"}`).join("\n") || "none",
    contracts: (mc ?? []).map((c: any) => `- ${c.description || c.website || "package"}: ${c.status}, ${c.monthly_amount} ${c.currency || "EUR"} ${c.billing_frequency || "monthly"}, since ${c.start_date ?? "?"}${c.stopped_at ? `, stopped ${String(c.stopped_at).slice(0, 10)}${c.stopped_reason ? ` (${c.stopped_reason})` : ""}` : ""}`).join("\n") || "none",
    outreach: (od ?? []).map((d: any) => `- ${String(d.created_at).slice(0, 10)}: ${d.status} – "${d.subject}"`).join("\n") || "none",
  };
}

export type { OutreachOrder };
