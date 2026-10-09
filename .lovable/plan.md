# Invoice template corrections after the legal/tax review

## My view of the analysis
The analysis is solid. Some findings can be fixed in the template; others are about individual invoices or company facts, and only you, Companies House or a tax adviser can settle those.

**Fix in the template (this plan):**
1. **Service date (Leistungsdatum):** every invoice needs one. It is missing today.
2. **Contradictory payment term:** the default note says "within 3 days" while the due date is 30 days later. The note will refer to the due date on the invoice instead.
3. **"Alle Steuern und Sozialabgaben…" sentence:** removed from the default note in every language. It proves nothing and can mislead.
4. **UID number:** already removed from invoices in the last update.
5. **UK registered address:** shown next to the Duisburg office, so the legal company is clearly identified.
6. **VAT wording:** "MwSt (0%)" with no reason is the biggest risk. Add an optional **Reverse Charge** switch that prints the German reverse-charge note. It is off by default and changes no amounts.

**Not template changes. You need to check these:**
- The incorporation date of Media Marketing Limited (the analysis says 08.10.2026, but the invoice is dated 05.10.2026). Check it on Companies House. Do not back-date invoices.
- The correct legal client name on INV-2026-1697 (Welfen-Apotheke OHG). You can edit it on that invoice.
- Clearer service descriptions per line item (e.g. "Prüfung und Bearbeitung von zwei Google-Bewertungen", quantity "1 Leistungspaket").
- Whether reverse charge applies at all, given the Duisburg office. A German tax adviser must confirm before the switch is used.
- Who owns each bank account.

## What changes on the invoice
- New fields on the invoice form: **Service date**, or **Service period from–to**. They are printed as "Leistungsdatum" / "Leistungszeitraum" (translated per invoice language). If left empty, the invoice date is used and printed as the service date.
- Header shows "Registered office: Monomark House, 27 Old Gloucester Street, London WC1N 3AX, United Kingdom" plus "Büroadresse: Düsseldorfer Str. 32, 47051 Duisburg".
- Default note (all languages): "Please pay the invoice amount by the due date stated above, without deduction." (in German: "Bitte überweisen Sie den Rechnungsbetrag ohne Abzug bis zum oben genannten Fälligkeitsdatum.")
- Template setting **"Reverse charge note"** (off by default). When on, it prints under the totals: "Leistungsort: Deutschland gemäß § 3a Abs. 2 UStG. Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge) gemäß § 13b UStG. Es wird keine deutsche Umsatzsteuer in Rechnung gestellt." It also replaces "MwSt (0%)" with "USt: Reverse Charge".
- Applies to the invoice preview and the downloaded/sent PDF. The service-date and reverse-charge additions are not added to monthly invoices.

## Technical details
- Migration: `invoices` add `service_date date`, `service_period_end date` (nullable).
- Invoice form in `InvoiceDetail.tsx`: two date inputs, saved via the existing update path (`update_invoice_with_lines` header jsonb — extend the function to accept both keys).
- `InvoicePreview.tsx` + `invoicePdfGenerator.ts`: render service date/period, registered office line, reverse-charge block; translations in `invoiceTranslations.ts`.
- `constants.ts` `DEFAULT_TERMS`: replace all languages with the neutral due-date sentence; saved templates still holding the old default text are migrated on load (custom text kept).
- `useInvoiceSettings`: add `reverseCharge: false`; checkbox in `InvoiceSettings.tsx`.
- Tests: default terms contain no "3 Tagen"/"Sozialabgaben"; reverse charge off by default; the service date falls back to the issue date.
