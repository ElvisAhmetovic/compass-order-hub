# Fix broken monthly invoice PDFs and missing attachments

## What is going wrong (from the monthly billing code)
- Since the logo was added, each monthly PDF got much bigger. The step that turns the PDF into an email attachment does it in one go, which fails on big files. When it fails, the invoice is saved but the email goes out without the PDF, or not at all.
- The logo used is the light (white) version, so on a white invoice it looks empty or broken at the top.
- The logo image is full size, which makes the PDF heavy and can cut off or blank the page in some PDF viewers.

## Fix
1. Convert the PDF to an attachment in small pieces, so big files never fail (client email and team copy).
2. Use the dark navy/cyan logo version made for white backgrounds, at a small size.
3. If the logo cannot load, still send the invoice normally without it.
4. Before sending, check the PDF is not empty; if it is, do not send and log an error so it shows in the monthly billing log instead of reaching the client broken.
5. Make one test monthly invoice PDF and send it only to invoice@mediaamarketing.com to confirm it opens fully, with logo, German + Belgian Wise bank details. No client gets anything.
6. List this month's monthly invoices whose email failed or went without PDF, so you can decide whether to resend them.

## Technical details
- `supabase/functions/generate-monthly-installments/index.ts`: replace `btoa(String.fromCharCode(...bytes))` (3 places) with a chunked base64 helper; switch `LOGO_URL` to the dark-on-light symbol asset; guard on PDF byte length; redeploy.
- Query `monthly_installments` / billing logs for November entries with `email_sent = false` or send errors.
