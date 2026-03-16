

## Allow Any Billing Frequency Number

### Current State
The billing frequency dropdown only offers 4 fixed options: 1, 2, 3, 6 months.

### Change
Replace the `<Select>` dropdown with a numeric `<Input>` field (min=1, max=duration), so the user can type any number of months (e.g., every 4 months, every 5 months, etc.).

### Files to Modify

**1. `src/components/monthly/CreateMonthlyContractModal.tsx`** (lines 304-320)
- Replace the `<Select>` with `<Input type="number" min="1" max="12">` 
- Keep the existing validation warning when duration is not divisible by frequency
- The form schema already accepts `z.coerce.number().min(1).max(12)` — no change needed there

**2. `src/components/monthly/MonthlyInstallmentsTable.tsx`** — already handles arbitrary numbers via the fallback `` `every ${freq} months` `` on line 31. No change needed.

**3. Service logic** — already works with any integer. No change needed.

### Single change
Replace the Select dropdown (lines 304-320) with a number input field labeled "Billing Frequency (months)" with a helper text like "Pay every X months".

