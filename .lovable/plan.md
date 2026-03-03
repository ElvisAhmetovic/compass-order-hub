

## Change Default Monthly Invoice Description

The fallback description `"Monthly Service - {month}"` appears in 3 places when a contract has no custom description. Change it to `"Google Monthly Service - {month}"`.

### Files to modify

1. **`src/components/monthly/SendMonthlyInvoiceDialog.tsx`** (lines 102 and 134) — change fallback from `Monthly Service -` to `Google Monthly Service -`
2. **`src/components/monthly/MonthlyInstallmentsTable.tsx`** (line 92) — same change

All three instances use the same pattern:
```ts
// Before
: `Monthly Service - ${installment.month_label}`;
// After
: `Google Monthly Service - ${installment.month_label}`;
```

If the contract already has a custom description set, that will still be used instead (the existing `contract.description ? ...` logic is preserved).

