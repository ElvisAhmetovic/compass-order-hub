# Invoice Notes follow the invoice language

## Cause
The Notes text you type in Template Settings is saved once for everyone and reused on every new invoice. Your Italian note from the last client stays on the Danish invoice, because a typed note always wins over the translated default.

## Fix
1. Each invoice keeps its own note. A note typed for one client stays on that invoice only.
2. New invoices start with the standard note in their own language (Danish here: "Betal venligst fakturabeløbet uden fradrag senest på den ovenfor angivne forfaldsdato.").
3. Changing the language in Template Settings switches the note to the standard text in that language. If you had typed your own note on that invoice, it is replaced too, so the note always matches the language. You can type a new one afterwards.
4. Existing invoices keep the note they already show. Notes saved globally before this change are no longer used on new invoices.
5. Preview, PDF download and Send to Client all use the invoice's own note.
6. Tests: a new invoice in Danish shows the Danish note even when the previous invoice had an Italian note; changing the language swaps the note.

## Technical notes
- Add nullable `invoices.custom_terms`; load into templateSettings.customTerms per invoice, save with the invoice. Stop persisting customTerms in shared/local template settings (drop it on load).
- On language change in InvoiceDetail, reset customTerms to "".
- Monthly invoices keep their current behaviour.
