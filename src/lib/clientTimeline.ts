export type TimelineKind = "outreach_offer" | "outreach_reply" | "team_reply" | "order_email" | "status_email";
export type TimelineEntry = { key: string; at: string; kind: TimelineKind; direction: "sent" | "received"; subject: string; who: string | null; body: string | null };
export type TimelineFilter = "all" | "sent" | "received" | "outreach" | "orders";

type Src = {
  offers?: { id: string; sent_at: string | null; subject: string; body: string; approved_by_name: string | null }[];
  replies?: { id: string; received_at: string; subject: string | null; text_body: string | null; from_name: string | null; from_email: string }[];
  messages?: { id: string; created_at: string; subject: string; body: string; sent_by_name: string | null; status: string }[];
  orderEmails?: { id: string; created_at: string; email_subject: string | null; template_name: string | null; custom_message: string | null; sent_by_name: string | null; invoice_number: string | null }[];
  statusEmails?: { id: string; created_at: string; sent_at: string | null; email_subject: string | null; new_status: string | null; changed_by_name: string | null; email_sent: boolean | null }[];
};

/** Merges every stored email with one client into one newest-first timeline. */
export function buildClientTimeline(s: Src): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const o of s.offers ?? []) if (o.sent_at) out.push({ key: `o${o.id}`, at: o.sent_at, kind: "outreach_offer", direction: "sent", subject: o.subject, who: o.approved_by_name, body: o.body });
  for (const r of s.replies ?? []) out.push({ key: `r${r.id}`, at: r.received_at, kind: "outreach_reply", direction: "received", subject: r.subject || "(no subject)", who: r.from_name || r.from_email, body: r.text_body });
  for (const m of s.messages ?? []) if (m.status === "sent") out.push({ key: `m${m.id}`, at: m.created_at, kind: "team_reply", direction: "sent", subject: m.subject, who: m.sent_by_name, body: m.body });
  for (const e of s.orderEmails ?? []) out.push({ key: `e${e.id}`, at: e.created_at, kind: "order_email", direction: "sent",
    subject: e.email_subject || e.template_name || (e.invoice_number ? `Invoice ${e.invoice_number}` : "Order email"), who: e.sent_by_name, body: e.custom_message });
  for (const n of s.statusEmails ?? []) if (n.email_sent !== false) out.push({ key: `n${n.id}`, at: n.sent_at || n.created_at, kind: "status_email", direction: "sent",
    subject: n.email_subject || `Status update: ${n.new_status ?? ""}`.trim(), who: n.changed_by_name, body: null });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export function filterTimeline(list: TimelineEntry[], f: TimelineFilter): TimelineEntry[] {
  if (f === "all") return list;
  if (f === "sent" || f === "received") return list.filter((e) => e.direction === f);
  if (f === "outreach") return list.filter((e) => e.kind === "outreach_offer" || e.kind === "outreach_reply" || e.kind === "team_reply");
  return list.filter((e) => e.kind === "order_email" || e.kind === "status_email");
}
