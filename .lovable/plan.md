

## Fix Input Field Alignment

The input boxes are misaligned because the Billing Frequency field has helper text below it, causing vertical misalignment across the row.

### Change
In `src/components/monthly/CreateMonthlyContractModal.tsx` line 272, add `items-start` to the grid container:

```tsx
<div className="grid grid-cols-4 gap-4 items-start">
```

This ensures all four fields (Total Value, Currency, Duration, Billing Freq.) align their tops consistently regardless of extra helper text below individual fields.

### File
`src/components/monthly/CreateMonthlyContractModal.tsx` — 1 line changed

