# Remove "Limited" from the invoice email subject, and what to do about the Impressum

## 1. Invoice email subject (I can do this)
In "Send Invoice to Client", the subject will no longer contain "Limited" in any language:
- German: "Media Marketing Limited Rechnung" becomes "Media Marketing Rechnung"
- English: "Media Marketing Invoice"; Dutch: "Media Marketing Factuur"; French: "Facture Media Marketing", and so on for all 30+ languages
- Monthly invoice emails get the same subject
- Saved subject templates in the CRM that still say "Media Marketing Limited ..." get updated too
- Nothing is sent to clients during this change

## 2. Impressum and footer on mediaamarketing.com (I can't change this here)
Screenshots 1–3 come from **mediaamarketing.com**, which is a separate website. It isn't part of this project, so I can't edit it from here. Whoever manages that site has to make these changes:
- Delete "Vertreten durch: Annalena Klein (Director)"
- Change "MEDIA MARKETING LTD" to "Media Marketing" in the Impressum
- Change "Media Marketing LTD" to "Media Marketing" in the footer bank details

Legal note: UK law requires a UK company to show its full registered name, MEDIA MARKETING LTD, in its legal notice. A German Impressum normally also has to name who represents the company. Please check with your adviser before removing these from the Impressum. Removing them from the bank details and other places is not a problem.

## Not changed
- Company name on invoice PDFs, legal pages on empriatech.com, and other emails (offers, reminders) stay as they are unless you tell me to change them too.

## Technical details
- Update subject strings in `src/components/monthly/monthlyInvoiceTemplates.ts` (and the matching test), plus any invoice-subject defaults in the send-invoice and monthly-billing functions. Redeploy those functions.
- Data update: in `email_templates`, replace `Media Marketing Limited` in subject fields only.
