

## Add Subject & Message Template Dropdowns with Translations

### What this does
Adds two dropdown selectors in the Send Invoice dialog (Monthly Packages) — one for subject templates and one for message templates — each pre-filled with translations across all supported European languages. Selecting a template auto-fills the corresponding field.

### Templates

**Subject templates** (one per language):
- EN: "Invoice & Quick Payment Option AB MEDIA TEAM"
- DE: "Rechnung & Schnelle Zahlungsoption AB MEDIA TEAM"
- NL: "Factuur & Snelle Betaaloptie AB MEDIA TEAM"
- FR: "Facture & Option de Paiement Rapide AB MEDIA TEAM"
- ES: "Factura & Opción de Pago Rápido AB MEDIA TEAM"
- DA: "Faktura & Hurtig Betalingsmulighed AB MEDIA TEAM"
- NO: "Faktura & Rask Betalingsalternativ AB MEDIA TEAM"
- CS: "Faktura & Rychlá Platební Možnost AB MEDIA TEAM"
- PL: "Faktura & Szybka Opcja Płatności AB MEDIA TEAM"
- SV: "Faktura & Snabb Betalningsalternativ AB MEDIA TEAM"

**Message templates** (one per language, same structure):
The provided English message translated to each language, maintaining the signature block (Annalena Klein, AB MEDIA, phone, address).

### UI changes in `SendMonthlyInvoiceDialog.tsx`

1. Add a constant map of subject templates keyed by language code
2. Add a constant map of message templates keyed by language code
3. Above the Subject input, add a "Subject Template" dropdown listing all languages — selecting one fills the subject field
4. Above the Message textarea, add a "Message Template" dropdown — selecting one fills the message field
5. Both dropdowns show the language name as the label (e.g., "English", "Deutsch")
6. The fields remain editable after auto-fill so users can still customize

### File to modify
- `src/components/monthly/SendMonthlyInvoiceDialog.tsx`

