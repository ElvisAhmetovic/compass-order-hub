I checked the database: the Magnum Motors invoice was created successfully and linked to the order.

Current row found:
- Invoice: `INV-2026-104`
- Client: `Magnum Motors`
- Amount: `30 EUR`
- Status: `sent`
- Created: `2026-06-29 09:12 UTC`
- Created by: `Thomas Klein`
- Linked order: `74534417-be4b-4c6b-a4f1-65d137960b18`

The likely issue is the invoice page is not making newly-created/linked order invoices easy to find, and it may sort by issue date only, not by actual creation time. Since all invoices made today share the same issue date, a new invoice can appear lower than expected.

Plan:
1. Update the invoice list sorting so `Newest` sorts by `created_at` first, then issue date, making just-created invoices appear at the top.
2. Add the linked order info into invoice search visibility, so searching Magnum/order/client details finds the invoice reliably.
3. Improve the invoice creation success toast from the dashboard to include the exact invoice number and a clear hint that it can be found in Invoices.
4. Make `InvoiceService.getInvoices()` return enough linked client/order context for the invoice page to display and filter consistently.
5. Add a visible “Created” date/time column or secondary text under issue date so workers understand when an invoice was actually generated versus the original order date.

No database schema change is needed because the invoice already exists correctly.