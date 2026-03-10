

## Remove Standalone VAT Calculator

The Netto/Brutto Rechner widget is redundant now that line items have built-in reverse VAT calculation.

### Changes

**Delete `src/components/invoices/VatCalculator.tsx`**

**`src/pages/InvoiceDetail.tsx`**
- Remove the import of `VatCalculator` (line 32)
- Remove the `<VatCalculator />` usage (line 720)

