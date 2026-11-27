import { INVOICE_STATUSES, ORDER_STATUS_COLUMNS } from "./assistantRules.ts";

/** Built-in description of how the Empria CRM works, always given to the assistant. */
export const SITE_GUIDE = `HOW THE SITE WORKS:
- Orders: one per client job. Statuses: ${Object.keys(ORDER_STATUS_COLUMNS).join(", ")}. Typical flow: Created → In Progress → Invoice Sent → Invoice Paid → Resolved; Complaint marks a client problem, Review means a review request, Cancelled stops the job and syncs its invoice to cancelled. Deleted orders are soft-deleted and hidden.
- Invoices: statuses ${INVOICE_STATUSES.join(", ")}. Overdue invoices get automatic payment reminders in the approved EN/DE wording; clients can be opted out or paused.
- Monthly packages (monthly_contracts): recurring billing with installments; some are billed by Stripe (then Stripe handles charges, stop via stop_stripe_package).
- Offers: quotes sent to clients; accepted offers become orders.
- Client portal: clients log in to see their orders, invoices and payments; accounts are created automatically for new orders.
- Customer tickets: support requests from clients or from outreach replies.
- AI Outreach: the AI drafts win-back offers, a team member approves, they send from office@mediaamarketing.com, and replies appear in the Replies tab.
- Follow-up reminders: dated reminders for team members.
- Money totals are visible only to the owners.`;
