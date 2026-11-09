# Client portal: clear Paid / Unpaid invoices

Today each invoice shows only a small "Paid" or "Open" tag in one mixed list. This change makes the split obvious.

## What clients will see (Invoices page)
- Summary at the top: **Unpaid** (count + total owed) and **Paid** (count + total paid), in their own amounts only.
- Filter tabs: **All / Unpaid / Paid**. The page opens on Unpaid when something is owed.
- Each invoice row shows: number, date, due date, amount, and a clear status:
  - **Paid** (green) with the paid date
  - **Unpaid** (amber), or **Overdue** (red) when past the due date
  - **Cancelled** (grey); cancelled invoices are not counted as owed
- Unpaid invoices keep the **Pay now** button when a payment link exists.
- Same status tags on the Dashboard payments box and the order page.
- German and English text.

## Rules (tested)
- Paid = invoice status "paid". Cancelled = "cancelled"/"canceled". Overdue = unpaid and due date before today. Everything else = Unpaid.
- Totals only include the client's own invoices (already enforced by the portal ownership rule).
- If invoices fail to load, the existing "Try again" card shows, never "nothing owed".

## Technical details
- New `invoiceStatus(inv, today)` helper + vitest in `billing/`.
- `InvoiceRow` uses it; `ClientInvoices.tsx` adds summary cards and tabs; overview payload adds `due_date`/`paid_at` if missing.
- Verify with Playwright as the test client (QA-TEST-001 shows Unpaid).
