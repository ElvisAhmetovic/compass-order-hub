

## Add Billing Frequency Display to Monthly Packages Table

### Change
In `src/components/monthly/MonthlyInstallmentsTable.tsx`, update the contract header row (line ~322) to show the billing period instead of always saying "/ month".

**Current:** `200,00 € / month`
**New (frequency=2):** `200,00 € / every 2 months`
**New (frequency=1):** `200,00 € / month` (unchanged for monthly)

Also update the progress indicator (line ~327) to show installment count instead of month count:
- **Current:** `6 / 12 paid`
- **New:** `6 / 6 paid` (actual installments, not duration months)

### Implementation
- Add a helper to format frequency label: `1 → "month"`, `2 → "every 2 months"`, `3 → "quarterly"`, `6 → "every 6 months"`
- Update line 322: use `contract.billing_frequency` to pick the right label
- Update lines 269-270: calculate `totalInstallments = duration_months / billing_frequency` for progress bar and paid count display

### File
`src/components/monthly/MonthlyInstallmentsTable.tsx` — ~5 lines changed

