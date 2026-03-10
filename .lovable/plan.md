

## Remove Payment Tracking, Reposition VAT Calculator

Remove the PaymentTracker component from the invoice detail sidebar and move the VatCalculator into its place (after the action buttons, at the bottom of the sidebar).

### Changes

**`src/pages/InvoiceDetail.tsx`**:
1. Remove the `import PaymentTracker` line (line 27)
2. Remove the PaymentTracker block (lines 759-766)
3. Move `<VatCalculator />` from line 728 (between Summary and buttons) to after the buttons block (after line 757, where PaymentTracker was)

Result: Summary → Action Buttons → VatCalculator (no more Payment Tracking section).

