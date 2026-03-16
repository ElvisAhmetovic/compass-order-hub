

## Fix Billing Frequency Field Alignment

The `billingFrequency` field is currently outside the `grid grid-cols-3` row that contains Total Value, Currency, and Duration. It needs to be moved into that grid.

### Change
In `src/components/monthly/CreateMonthlyContractModal.tsx`:
- Change `grid grid-cols-3` (line 274) to `grid grid-cols-4` to accommodate 4 fields in one row
- Move the `billingFrequency` FormField (lines 304-314) inside that grid, right after Duration
- Keep the helper text and validation warning beneath the input

This puts Total Value, Currency, Duration, and Billing Frequency all on the same row, aligned properly.

