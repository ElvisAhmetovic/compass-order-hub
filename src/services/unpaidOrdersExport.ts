import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const OTHER_FLAGS = [
  "status_invoice_paid", "status_in_progress", "status_complaint", "status_resolved",
  "status_cancelled", "status_deleted", "status_review",
] as const;

/** True when an order is labeled Invoice Sent and nothing else (Created is ignored). */
export const isOnlyInvoiceSent = (o: Record<string, any>): boolean =>
  !!o.status_invoice_sent && !o.deleted_at && OTHER_FLAGS.every((f) => !o[f]);

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "");

export async function exportUnpaidInvoiceSentOrders(): Promise<number> {
  const orders: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status_invoice_sent", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) throw error;
    orders.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const rows = orders.filter(isOnlyInvoiceSent);
  if (rows.length === 0) return 0;

  const ids = rows.map((o) => o.id);
  const companyIds = [...new Set(rows.map((o) => o.company_id).filter(Boolean))];
  const invoices: any[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from("invoices")
      .select("order_id, invoice_number, due_date, status").in("order_id", ids.slice(i, i + 200));
    invoices.push(...(data || []));
  }
  const companies: any[] = [];
  for (let i = 0; i < companyIds.length; i += 200) {
    const { data } = await supabase.from("companies")
      .select("id, name, email, phone, address, contact_person").in("id", companyIds.slice(i, i + 200));
    companies.push(...(data || []));
  }
  const compMap = new Map(companies.map((c) => [c.id, c]));

  const sheetRows = rows.map((o) => {
    const inv = invoices.filter((i) => i.order_id === o.id && i.status !== "cancelled");
    const c = compMap.get(o.company_id) || {};
    return {
      "Order ID": o.id,
      "Order date": fmtDate(o.created_at),
      "Invoice Sent date": fmtDate(o.status_date),
      "Company name": o.company_name || "",
      "Contact name": o.contact_name || "",
      "Email": o.contact_email || "",
      "Phone": o.contact_phone || "",
      "Address": o.company_address || "",
      "Company link": o.company_link || "",
      "Amount": Number(o.price ?? o.amount ?? 0),
      "Currency": o.currency || "EUR",
      "Order for": o.description || "",
      "Yearly package": o.is_yearly_package ? "Yes" : "No",
      "Assigned to": o.assigned_to_name || o.agent_name || "",
      "Invoice number(s)": inv.map((i) => i.invoice_number).join(", "),
      "Invoice due date": inv.map((i) => fmtDate(i.due_date)).filter(Boolean).join(", "),
      "Client company": c.name || "",
      "Client company email": c.email || "",
      "Client company phone": c.phone || "",
      "Client company address": c.address || "",
      "Client contact person": c.contact_person || "",
      "Internal notes": o.internal_notes || "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(sheetRows);
  ws["!cols"] = Object.keys(sheetRows[0]).map((k) => ({
    wch: Math.min(50, Math.max(k.length, ...sheetRows.map((r: any) => String(r[k] ?? "").length)) + 2),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Unpaid Invoice Sent");
  XLSX.writeFile(wb, `unpaid-invoice-sent-orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  return rows.length;
}
