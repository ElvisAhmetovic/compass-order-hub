

## Netto/MwSt/Brutto Calculator Widget

Add a VAT calculator card to the right sidebar of the invoice edit tab (alongside the existing Summary and action buttons), inspired by the uploaded reference image.

### What it does
- User enters a **Netto (net)** amount
- Picks a VAT rate via quick-select buttons: **7%**, **19%**, or **Individuell** (custom input)
- Displays calculated **MwSt (VAT)** and **Brutto (gross)** amounts in real-time
- A "Berechnen" (Calculate) button is optional since we can calculate live, but we'll include it for parity with the reference
- Results section shows Netto, MwSt, Brutto with copy-to-clipboard buttons

### Layout placement
In `src/pages/InvoiceDetail.tsx`, the edit tab uses a `grid grid-cols-1 lg:grid-cols-3` layout. The right column (lines 706-764) has Summary, action buttons, and PaymentTracker. The new calculator card will be inserted into this right column, between the Summary card and the action buttons.

### Implementation

**New file: `src/components/invoices/VatCalculator.tsx`**
- Self-contained component with local state: `netAmount`, `vatPercent`, `customVat`, `mode` (7/19/custom)
- Quick-select buttons for 7% and 19%, plus "Individuell" that shows a custom input
- Computed `vatAmount = net * rate`, `grossAmount = net + vatAmount`
- Results section with copy buttons (using `navigator.clipboard`)
- Styled to match the reference: card layout, button group for rates, result display

**Modified file: `src/pages/InvoiceDetail.tsx`**
- Import `VatCalculator`
- Add `<VatCalculator />` in the right sidebar column (around line 726, after the Summary card)

