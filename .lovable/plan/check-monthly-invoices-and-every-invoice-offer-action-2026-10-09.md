# Check monthly invoices and every invoice/offer action

## 1. Monthly package invoices (automatic)
- Confirm they list only German Bank + Revolut, never Wise (already true in the generator — lock it in with a test).
- Confirm they carry the new company details: Media Marketing Limited, company number, London office + Duisburg office, Annalena Klein, abm-team.com, new logo, neutral payment note.
- Render a sample monthly invoice PDF locally (no email sent) and inspect it visually.
- Check the monthly email text and the catch-up job use the same details.
- Fix anything outdated or inconsistent.

## 2. Invoice actions — check each works end to end
- Edit invoice: Save, Send invoice, Download PDF, new Service Date fields save and print.
- Preview: Send to client, Download PDF.
- Payment account tick boxes reflected in preview, downloaded and sent PDF.
- Reverse-charge switch off by default, prints correctly when on.
- Invoices list: filters, open, status changes, cancel sync.
- Sending path (send-invoice-pdf function): validate request handling with a dry test that does not email clients.

## 3. Offers
- Create/edit offer, Download PDF, Send offer, offer confirmation page: new company details, director, logo, bank accounts.

## 4. Other spots
- Payment reminders and payment confirmation emails: same accounts and wording.
- Template settings: logo, website, account boxes persist.

## How it is checked
- Code review of every path above, typecheck, full test suite, new tests for monthly accounts (German + Revolut only).
- Local PDF renders inspected as images.
- No real emails are sent to clients.
- CRM sign-in isn't available from here, so the final click-through of buttons in your account is on you; I'll give a short checklist.

## Output
- Fix any broken items found, then report what was checked, what was fixed, and what you should click-test.
