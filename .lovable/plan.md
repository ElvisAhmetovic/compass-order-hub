# Send to Client: follow the invoice language (e.g. Italian)

## Cause
Invoices can be set to 22 languages (Italian included), but the Send to Client email has texts in only 10 (EN, DE, NL, FR, ES, DA, NO, CS, PL, SV). When you pick Italiano, there is no Italian email text, so it falls back to English. The same happens for Russian, Ukrainian, Romanian, Turkish, Portuguese, Hungarian, Greek, Bulgarian, Finnish, Slovak, Slovenian and Macedonian.

## Fix
1. Add Send to Client subject and message texts for the 12 missing languages, using the same approved structure: greeting, invoice attached, pay "by the due date stated on the invoice", no bank details, closing and signature.
2. Add the Stripe hint and button text in those languages, so the button also shows in Italian, Romanian and the rest.
3. Add all 22 languages to the subject/message template dropdowns in Send to Client.
4. Send to Client opens in the invoice's current language every time, including after switching the language in Template Settings without reloading.
5. Tests: every invoice language has its own email text (no English fallback), and Italian opens with the Italian subject.

## Technical notes
- `src/components/monthly/monthlyInvoiceTemplates.ts`: extend SUBJECT_TEMPLATES, CLIENT_MESSAGE_TEMPLATES, TEMPLATE_LANGUAGES and the Stripe hint map.
- `SendInvoicePDFDialog.tsx`: keep the open-time init from `templateSettings.language`; add a test.
- Monthly package emails stay as they are.
