# "Zip It" button: export unpaid "Invoice Sent" orders

## What you get
- A new **Zip It** button on the Dashboard, right next to **Create Order**.
- Clicking it downloads an Excel file (.xlsx) with one row per order that is **only** "Invoice Sent" (the "Created" label is ignored, since every order has it).
- An order is left out if it also has any other label: Invoice Paid, In Progress, Complaint, Resolved, Cancelled, Deleted or Review. Deleted orders are left out too.
- It is always built fresh from the current data, so an order that got paid or changed since the last download won't show up next time. Right now 81 orders match.

## Columns in each row
Order ID, Order date, Date marked Invoice Sent, Company name, Contact name, Email, Phone, Address, Company link, Amount, Currency, What the order was for (description), Yearly package (Yes/No), Assigned to, Linked invoice number(s), Invoice due date, Client company details (name, email, phone, address, contact person).

Internal notes are **not** included, so the file is safe to share.

File name: `unpaid-invoice-sent-orders-YYYY-MM-DD.xlsx`. The button shows a spinner while it builds, and a message if there are no matching orders.

## Who can use it
All staff who can see orders (not clients). Tell me if only Johann, Thomas and Max should have it, since the file contains money amounts.

## Technical details
- `DashboardHeader.tsx`: optional second button slot; `Dashboard.tsx` passes a "Zip It" button (lucide `FileArchive` icon).
- New `src/services/unpaidOrdersExport.ts`: query `orders` with `status_invoice_sent = true` and all other status flags false/null, `deleted_at is null`; paged past the 1000-row limit; join `invoices` (by order_id) and `companies` (by company_id).
- Build the .xlsx in the browser with SheetJS (`xlsx` package); amounts as numbers, bold header row, sensible column widths.
- Unit test for the "only Invoice Sent" filter logic.
