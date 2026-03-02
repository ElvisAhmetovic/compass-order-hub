

## Test: Trigger Auto-Invoice for Magnum Motors März 2026

The edge function ran successfully but skipped the installment because `email_sent` is already `true`. To test the full automated flow, we need to:

### Steps

1. **Reset the installment** — Run a DB update to set `email_sent = false` and `invoice_id = null` on the März 2026 installment (`id: 3efe1fd2-df86-46d4-80c9-4b94fd44886d`)

2. **Trigger the function** — Call `generate-monthly-installments` again via curl

3. **Verify results**:
   - Check that a new invoice was created in the `invoices` table
   - Check that the installment now has `invoice_id` set and `email_sent = true`
   - Check the edge function logs to confirm the PDF was generated and email sent to `jusufprazina788@gmail.com`
   - Verify team notifications were sent in parallel

### What will happen

The function will:
1. Find the existing März 2026 installment with `email_sent = false`
2. Look up or create a client record for `jusufprazina788@gmail.com`
3. Generate invoice number (e.g., `RE NR-2026-XXX`)
4. Create invoice record + line item (`test – März 2026`, €100, 19% VAT)
5. Generate a PDF using jsPDF with AB Media branding
6. Send the PDF-attached email to `jusufprazina788@gmail.com`
7. Send team notifications in parallel to all 12 team members

### Files to Modify

None — this is a DB reset + edge function trigger test only.

