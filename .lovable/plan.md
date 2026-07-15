# QA verification — invoice edits not reflecting in the list

## What your boss reported
1. Edits an invoice, hits Save. The emailed PDF is correct, but the Invoices list still shows the old data.
2. Editing the **price** saves fine. Editing the **company details** (name/address/email) does not.

## Diagnosis (confirmed)
In `src/pages/InvoiceDetail.tsx`, the "Bill To" fields (company name, email, address, city, zip, country) lived in local React state `billToOverride`, used only to render the PDF/preview. The `handleSave` function only wrote `client_id`, dates, currency, payment terms, and notes to the DB — never the Bill-To fields. Line items (price) were saved through a separate path, which is why the **price change persisted but company edits did not**. The Invoices list then re-rendered from `invoice.client?.name/email` — an untouched foreign row — so the change looked lost.

## Fix status: applied

### Database — verified
Six new nullable columns exist on `public.invoices`:
`bill_to_name, bill_to_email, bill_to_address, bill_to_city, bill_to_zip_code, bill_to_country`.

### Code — verified
- `src/types/invoice.ts` — six optional `bill_to_*` fields added to the `Invoice` type.
- `src/pages/InvoiceDetail.tsx`
  - `handleSave` (existing-invoice branch) now writes all six `bill_to_*` fields alongside the other invoice fields.
  - The unmount auto-save also writes the six fields, so unsaved edits aren't dropped.
  - `loadData` hydrates `billToOverride` from the invoice's stored `bill_to_*` values first, falling back to the linked client for empty fields.
  - The "auto-fill on client change" effect now bails out during initial load (`!initialLoadDone.current`), so it can't wipe the stored override the moment the invoice opens.
- `src/pages/Invoices.tsx`
  - Client name cell: `invoice.bill_to_name || invoice.client?.name`.
  - Client email cell: same fallback.
  - Search filter and A-Z / Z-A sort use the same override-first fallback.
- PDF generator unchanged — it already reads from the `billToClient` object built off `billToOverride`, which is why the PDF was already correct.

## Manual test checklist for you to run
1. Open an existing invoice, change the company name + email + address, click Save, return to `/invoices` — the row should now show the new name/email.
2. Reopen the same invoice — the Bill-To fields should still show your edits (not the raw client record).
3. Change only the price on a different invoice — the list's client column stays the same, the price stays saved.
4. On an invoice, switch the linked client from the dropdown — Bill-To should auto-fill from the newly picked client (still expected behavior).
5. Download the PDF after step 1 — it should match the new Bill-To values, same as before.

## Not changed (intentional)
- The `clients` table is not modified when a Bill-To override is entered — per the project rule that overrides preserve edits for a single invoice's PDF without altering the underlying client record.
- No email/PDF template changes.
- Price/line-item save path untouched.

Approve this plan and I'll run a live Playwright smoke test against the preview to capture screenshot evidence of the fix on a real invoice.