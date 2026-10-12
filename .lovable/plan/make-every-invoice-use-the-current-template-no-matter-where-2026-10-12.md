# Make every invoice use the current template, no matter where it's created

## What's going wrong
The invoice layout (logo, company details, payment note, bank accounts) is not stored with each invoice. It is rebuilt from settings saved **in each person's own browser**. Those saved settings are only updated when someone opens Invoice Template Settings. Colleagues who haven't opened it since the changes still have the old copy: old logo, "AB Media Team", the UID number, the Gmail address and the "3 days" note.

The screens used from the orders dashboard read that old copy as it is:
- the invoice list's download button
- the order reminder window that attaches the invoice
- the invoice edit page when opened from an order
- the invoice file builder itself, which re-reads the old logo

Second problem: invoices made from an order store the internal text "Invoice created from order. Order ID: …" as their note. The invoice file can print it where the payment note should be.

## Fix
1. **One shared loader for template settings.** Every screen that builds an invoice will use it. It always:
   - takes the company details (name, number, address, contact person, director, website) from the shared company settings, never the browser copy
   - replaces the old logos with the new Media Marketing logo, unless someone uploaded their own
   - resets the old "3 days" note to the current default, keeping real custom text
   - converts old account choices to the tick-box format (default: German + Revolut)
2. Use it in the invoice list download, the order reminder window, the invoice edit page and the invoice file builder. Remove the separate old-logo lookup in the file builder.
3. **Order-created invoices:** stop putting "Invoice created from order…" in the client-facing note; keep it only in the internal note. The invoice file never prints the stored note in place of the payment note.
4. Invoices already created this way look correct automatically the next time they're downloaded or sent. Nothing needs to be redone.

## Technical details
- New `src/components/invoices/loadTemplateSettings.ts`: `async loadInvoiceTemplateSettings()`. It reads localStorage, applies the logo, terms and account normalisation from `constants.ts`, and merges `await loadCompanyInfo()` as `companyInfo`. Reuse it inside `useInvoiceSettings` too.
- Callers: `Invoices.tsx` (~196), `SendClientReminderModal.tsx` (~161), `InvoiceDetail.tsx` (~54, initial plus async refresh), `invoicePdfGenerator.ts` (`getSavedLogo` removed; line 441 no longer falls back to `formData.notes`).
- `OrderRow.tsx`, `OrderActions.tsx`, `orderService.ts`: set `notes: ''`.
- Test: stale settings (old logo, old company name, legacy terms, `"all"` account) come back as the new logo, the DB company name, empty terms and `["germany","revolut"]`.
