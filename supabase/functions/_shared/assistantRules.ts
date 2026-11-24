// Rules for the admin assistant. Pure helpers, tested in admin-assistant/rules_test.ts.
export const FINANCE_VIEWER_EMAILS = [
  "business@team-abmedia.com",
  "kontakt.abmedia@gmail.com",
  "luciferbebistar@gmail.com",
];
export const canViewFinanceTotals = (email?: string | null) =>
  !!email && FINANCE_VIEWER_EMAILS.includes(email.trim().toLowerCase());

/** Tables the assistant may read, with the only columns it may see or filter on. */
export const READ_TABLES: Record<string, { cols: string[]; date: string; money?: string[]; search: string[] }> = {
  orders: { cols: ["id", "company_name", "contact_name", "contact_email", "contact_phone", "status", "price", "amount", "currency", "description", "internal_notes", "client_visible_update", "assigned_to_name", "priority", "created_at", "status_date", "is_yearly_package", "deleted_at"], date: "created_at", money: ["price", "amount"], search: ["company_name", "contact_name", "contact_email", "description"] },
  clients: { cols: ["id", "name", "email", "phone", "created_at"], date: "created_at", search: ["name", "email"] },
  invoices: { cols: ["id", "invoice_number", "order_id", "client_id", "status", "issue_date", "due_date", "paid_at", "total_amount", "net_amount", "vat_amount", "currency", "bill_to_name", "bill_to_email", "reminder_count", "created_at"], date: "issue_date", money: ["total_amount", "net_amount", "vat_amount"], search: ["invoice_number", "bill_to_name", "bill_to_email"] },
  monthly_contracts: { cols: ["id", "client_name", "client_email", "status", "monthly_amount", "total_value", "currency", "start_date", "duration_months", "billing_frequency", "payment_method", "stripe_status", "stripe_ends_at", "description", "created_at"], date: "created_at", money: ["monthly_amount", "total_value"], search: ["client_name", "client_email", "description"] },
  monthly_installments: { cols: ["id", "contract_id", "client_name", "client_email", "month_label", "due_date", "amount", "currency", "payment_status", "paid_at", "created_at"], date: "due_date", money: ["amount"], search: [] },
  stripe_payments: { cols: ["id", "client_email", "contract_id", "order_id", "amount", "currency", "status", "paid_at", "payment_method_label", "failure_reason", "refunded_amount", "dispute_status", "created_at"], date: "created_at", money: ["amount", "refunded_amount"], search: [] },
  customer_tickets: { cols: ["id", "order_id", "client_email", "client_name", "company_name", "subject", "status", "message", "notes", "created_at"], date: "created_at", search: ["client_email", "client_name", "company_name", "subject"] },
  follow_up_reminders: { cols: ["id", "company_name", "contact_phone", "note", "remind_at", "assignee_email", "assignee_name", "status", "created_at"], date: "remind_at", search: ["company_name", "note"] },
  offers: { cols: ["id", "client_name", "client_email", "company_name", "description", "price", "currency", "status", "sent_by_name", "created_at", "confirmed_at", "expires_at"], date: "created_at", money: ["price"], search: ["client_name", "client_email", "company_name"] },
  client_portal_activity: { cols: ["*"], date: "created_at", search: [] },
};

export const WRITE_TOOLS = [
  "create_order", "update_order", "set_order_status", "set_invoice_status",
  "create_follow_up_reminder", "set_ticket_status", "set_contract_status", "create_portal_account",
] as const;
export type WriteTool = typeof WRITE_TOOLS[number];
/** Every write tool needs a human Confirm click; nothing writes during the chat. */
export const needsConfirmation = (tool: string) => (WRITE_TOOLS as readonly string[]).includes(tool);

export const ORDER_STATUS_COLUMNS: Record<string, string> = {
  "Created": "status_created", "In Progress": "status_in_progress", "Complaint": "status_complaint",
  "Invoice Sent": "status_invoice_sent", "Invoice Paid": "status_invoice_paid", "Resolved": "status_resolved",
  "Cancelled": "status_cancelled", "Review": "status_review",
};
export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];

/** Money sums/lists of money columns on finance tables are owner-only. */
export function moneyBlocked(table: string, field: string | undefined, email?: string | null) {
  const t = READ_TABLES[table];
  if (!t?.money || !field) return false;
  return t.money.includes(field) && !canViewFinanceTotals(email);
}

export function safeColumns(table: string, requested?: string[]): string[] {
  const t = READ_TABLES[table];
  if (!t) return [];
  if (t.cols[0] === "*") return ["*"];
  const ok = (requested ?? []).filter((c) => t.cols.includes(c));
  return ok.length ? ok : t.cols;
}
