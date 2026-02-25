

## Add "Send to Client" Button in Invoice Preview

### What this does
Adds a "Send to Client" button next to the existing "Download PDF" button in the invoice Preview tab. Clicking it opens a small dialog with the client's email pre-filled (from the Bill To section) and a text area where you can write a custom message. The invoice PDF is generated and sent as an attachment along with your message.

### Changes

**1. New component: `src/components/invoices/SendInvoicePDFDialog.tsx`**
- Small dialog with:
  - Client email field (pre-filled from the selected client, editable)
  - Email subject field (pre-filled with "Invoice {number} from AB Media Team")
  - Text area for custom message body (e.g. "Please find attached your invoice...")
  - Cancel and Send buttons
- On send: generates the PDF using the existing `generateInvoicePDF` utility, then calls a new edge function to email it

**2. New edge function: `supabase/functions/send-invoice-pdf/index.ts`**
- Accepts: `client_email`, `subject`, `message`, `pdf_base64`, `invoice_number`
- Sends email via Resend (using `RESEND_API_KEY_ABMEDIA` / noreply@abm-team.com) with the PDF as an attachment and the custom message as the HTML body
- Also notifies the team emails (same list from `notificationEmails.ts`)

**3. Update `src/utils/invoicePdfGenerator.ts`**
- Add a variant of the PDF generation that returns the PDF as a base64 string (instead of downloading), so it can be sent as an attachment. Currently `generateInvoicePDF` calls `pdf.save()` which triggers a download — we need a `generateInvoicePDFBase64` that calls `pdf.output('datauristring')` or similar instead.

**4. Update `src/pages/InvoiceDetail.tsx`** (Preview tab, lines 618-635)
- Add a "Send to Client" button next to "Download PDF"
- Import and render the new `SendInvoicePDFDialog`
- Pass the necessary props: client email, invoice data, line items, template settings

### Technical detail

The dialog flow:
1. User clicks "Send to Client" in preview tab
2. Dialog opens with client email pre-filled, subject pre-filled, empty message body
3. User writes their message
4. On "Send": PDF is generated client-side as base64, sent to the edge function along with the email details
5. Edge function sends the email with PDF attachment via Resend
6. Success toast shown, dialog closes

