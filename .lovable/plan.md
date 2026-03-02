

## Auto-Generate Invoices + PDF in Monthly Cron Job

Currently the `generate-monthly-installments` cron job (runs 1st of each month) only sends a plain-text "Monatliche Rechnung" email. You want it to also automatically create the invoice record in the database and send the professional PDF invoice — eliminating all manual work.

### Challenge

The current PDF generator (`invoicePdfGenerator.ts`) uses `html2canvas` + DOM manipulation, which only works in browsers. The cron job runs server-side in Deno. So we need to generate the PDF directly using jsPDF's text/drawing API in the edge function.

### Plan

**Modify `supabase/functions/generate-monthly-installments/index.ts`** to add these steps for each installment:

1. **Find or create client** — Query `clients` table by email; if not found, insert a new client using contract data (name, email, address, phone)
2. **Create invoice record** — Call `generate_invoice_number` RPC, insert into `invoices` table with the correct VAT-inclusive math (`amount / 1.19` for net price, 19% VAT)
3. **Create line item** — Insert into `invoice_line_items` with the contract description + month label
4. **Generate PDF server-side** — Use jsPDF via `esm.sh` to create a clean invoice PDF with:
   - Company header (AB Media branding)
   - Client billing info
   - Invoice number, dates
   - Line items table with net, VAT, total
   - Bank details (Belgium + Germany accounts, same as the frontend template)
5. **Send PDF via Resend** — Attach the PDF to the client email (replacing the current plain-text email)
6. **Team notifications** — Send in parallel using `Promise.allSettled` (already optimized pattern)

### What Changes

| Area | Before | After |
|------|--------|-------|
| Client email | Plain text "Monatliche Rechnung" | Professional PDF invoice attached |
| Invoice record | Must be created manually | Auto-created in DB |
| Client record | Must exist or be created manually | Auto-created if missing |
| Manual work | Create invoice → Send invoice → done | Fully automatic, zero manual steps |

### Technical Details

- **PDF generation**: Uses `jsPDF` imported via `https://esm.sh/jspdf@2.5.1` in Deno — no DOM needed, uses `doc.text()`, `doc.line()`, `doc.rect()` for layout
- **Bank details hardcoded**: Belgium (BE79967023897833, TRWIBEB1XXX) and Germany (DE91240703680071572200, DEUTDE2HP22) — same as frontend template
- **Invoice language**: Defaults to German (most clients), matching the existing "Monatliche Rechnung" pattern
- **Idempotency**: If an installment already has an invoice (re-run safety), it skips invoice creation but still sends the email if `email_sent` is false
- **New column**: Add `invoice_id` to `monthly_installments` table to link installments to their auto-generated invoices

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-monthly-installments/index.ts` | Add client/invoice auto-creation, server-side PDF generation, attach PDF to email |
| DB migration | Add `invoice_id` column to `monthly_installments` table |

