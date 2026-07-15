# Fix: invoice company-detail edits not reflecting in the Invoices list

## The problem
When editing an invoice, the "Bill To" section (company name, address, email, city, zip code, country) lives in a local React state called `billToOverride` in `src/pages/InvoiceDetail.tsx`. That state is:

- used to render the PDF and preview (so the emailed PDF is correct — matches what your boss sees),
- **never written back to the database** on save.

The `handleSave` function only persists: `client_id`, `issue_date`, `due_date`, `currency`, `payment_terms`, `notes`, `internal_notes`, plus line items (which is why the **price change did save** — line items are updated separately).

The Invoices list then displays `invoice.client?.name` / `invoice.client?.email` pulled from the linked client record, which was never touched. Result: the invoice row looks unchanged even though the PDF is correct.

## The fix

Persist the Bill-To override on the invoice itself (not on the client — per project rule, we don't overwrite the client record from an invoice edit), and show those override values in the Invoices list when present.

### 1. Database
Add six nullable columns to `public.invoices`:
- `bill_to_name`, `bill_to_email`, `bill_to_address`, `bill_to_city`, `bill_to_zip_code`, `bill_to_country` (all `text`).

No RLS changes required — existing invoice policies already cover these columns.

### 2. Save path — `src/pages/InvoiceDetail.tsx`
- Include the `bill_to_*` fields in the `invoiceUpdateData` object inside `handleSave` (the existing-invoice branch, ~line 428).
- Also include them in the auto-save-on-unmount effect (~line 135) so unsaved edits aren't lost.
- On initial load, hydrate `billToOverride` from the invoice's `bill_to_*` columns first, and only fall back to the client record if those are empty (the current effect at line 158 unconditionally overwrites from the client — change it to only fill blanks or run only when the client is switched, not on initial mount).

### 3. Load path — `src/services/invoiceService.ts`
`getInvoice` / `getInvoices` already return all invoice columns via `select('*')`, so the new fields flow through automatically. Update the `Invoice` TypeScript type in `src/types/invoice.ts` to include the six optional `bill_to_*` fields.

### 4. Listing display — `src/pages/Invoices.tsx`
In the client cell (~lines 599–600) and the search filter (~lines 347–349), prefer the override when present:
- name: `invoice.bill_to_name || invoice.client?.name`
- email: `invoice.bill_to_email || invoice.client?.email`

Sort comparators (lines 392/394) get the same fallback.

### 5. PDF generator
No change needed — it already reads from `billToOverride` via the `billToClient` object passed to `InvoiceService`/PDF utilities.

## Out of scope
- Not modifying the underlying `clients` table on invoice save (project rule: Bill-To override preserves edits for the PDF without altering the client record).
- Not changing price/line-item logic — that path already works.
- Not touching email/PDF templates.

## Verification
1. Open an existing invoice, change company name + address + email, save.
2. Confirm the Invoices list row shows the new name/email immediately after refresh.
3. Confirm the PDF still renders the same edited values.
4. Confirm editing only the price (without touching Bill-To) still saves and the client column is unchanged.
5. Confirm switching the linked client on an invoice still auto-fills Bill-To from that new client.
