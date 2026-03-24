

## Add VAT Toggle & Percentage to Create Order Modal

### What Changes
Add a VAT enable/disable switch and a VAT percentage input field next to the price/currency row in the Create Order modal. When enabled, the calculated total (price + VAT) will be shown below.

### Files to Change

**`src/components/dashboard/CreateOrderModal.tsx`**
- Add `vatEnabled` and `vatPercentage` state variables (default: disabled, 20%)
- Add a new row below the price/currency grid with:
  - A Switch toggle to enable/disable VAT
  - A number input for VAT % (only visible when enabled)
  - A calculated display showing: net price, VAT amount, and total
- Reset `vatEnabled`/`vatPercentage` when modal opens or form resets
- No schema changes needed — these are local UI state, not persisted to DB (VAT is informational for the order creator)

### Layout
The price section currently has a 2-column grid (Price | Currency). Below it, a new section will appear:

```text
[Price] [Currency]
[VAT Toggle: Enable VAT] [VAT %: 20]
Net: €100.00 | VAT (20%): €20.00 | Total: €120.00
```

The VAT % input and calculation only show when the toggle is ON.

