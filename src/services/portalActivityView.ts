export type ActivityRow = { id: string; user_id: string; user_email: string | null; event: string; details: Record<string, unknown> | null; created_at: string };

export const EVENT_LABELS: Record<string, string> = {
  login: "Logged in", logout: "Logged out", page_view: "Opened page", pay_clicked: "Clicked Pay",
  invoice_filter: "Filtered invoices", document_downloaded: "Downloaded document", package_cancelled: "Cancelled package",
  ticket_created: "Created support ticket", language_changed: "Changed language", load_failed: "Page failed to load",
};

const PAGE_NAMES: Record<string, string> = {
  "/client/dashboard": "Dashboard", "/client/orders": "Orders", "/client/orders/:id": "Order details",
  "/client/invoices": "Invoices", "/client/support": "Support", "/client/support/:id": "Support ticket", "/client/settings": "Settings",
};
const PAY_TYPES: Record<string, string> = { package: "monthly package", order_link: "order payment link", invoice: "invoice", failed_payment: "failed payment retry" };

/** One-line, human-readable description of an activity's details. */
export function describeActivity(r: Pick<ActivityRow, "event" | "details">): string {
  const d = r.details ?? {};
  const page = typeof d.page === "string" ? PAGE_NAMES[d.page] ?? d.page : "";
  switch (r.event) {
    case "login": case "language_changed": return d.language ? `Language: ${String(d.language).toUpperCase()}` : "";
    case "page_view": case "load_failed": return page;
    case "pay_clicked": return PAY_TYPES[String(d.type)] ?? "";
    case "invoice_filter": return d.filter ? `Filter: ${d.filter}` : "";
    case "document_downloaded": return d.kind === "pdf" ? "Invoice PDF" : "Receipt";
    default: return "";
  }
}

/** Totals for the summary cards. Active clients = distinct accounts with any activity. */
export function activitySummary(rows: Pick<ActivityRow, "event" | "user_id">[]) {
  return {
    logins: rows.filter((r) => r.event === "login").length,
    activeClients: new Set(rows.map((r) => r.user_id)).size,
    payClicks: rows.filter((r) => r.event === "pay_clicked").length,
    loadErrors: rows.filter((r) => r.event === "load_failed").length,
  };
}
