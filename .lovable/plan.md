

## Add Billing Frequency to Monthly Contracts

### Problem
Currently the system assumes 1 installment per month. A client wants to pay 1200 EUR in 6 bi-monthly payments of 200 EUR over 12 months. To achieve 200 EUR installments today, you must set duration to 6 months — which misrepresents the actual contract length.

### Solution
Add a **Billing Frequency** dropdown (Every month, Every 2 months, Every 3 months, Every 6 months) to the contract creation form. The system will calculate:
- **Number of installments** = duration ÷ frequency
- **Installment amount** = total value ÷ number of installments
- **Installment dates** = spaced by the selected frequency

For the example: Duration=12, Frequency=2 → 6 installments of 200 EUR, due every 2 months.

### Changes

**1. Database migration** — Add `billing_frequency` column to `monthly_contracts`:
```sql
ALTER TABLE monthly_contracts 
  ADD COLUMN billing_frequency integer NOT NULL DEFAULT 1;
```

**2. `src/services/monthlyContractService.ts`**
- Add `billing_frequency` to the `MonthlyContract` interface
- Update `createContract`: calculate `monthlyAmount = total_value / (duration_months / billing_frequency)`
- Update installment generation loop: iterate `duration / frequency` times, spacing dates by `frequency` months

**3. `src/components/monthly/CreateMonthlyContractModal.tsx`**
- Add `billingFrequency` field to form schema (default: 1)
- Add a **Billing Frequency** select dropdown next to Duration
- Update the preview section: show correct installment count and amount
- Validate that duration is divisible by frequency
- Pass `billing_frequency` to the service

**4. Preview section update** — Instead of "Monthly Installment", show:
- "Installment (every 2 months)" with the correct amount
- "6 installments × 200,00 € = 1.200,00 €"

### Technical Details
- The `billing_frequency` integer represents months between payments (1=monthly, 2=bi-monthly, 3=quarterly, 6=semi-annual)
- Installment dates: `startDate + (i * billing_frequency)` months for each installment `i`
- The `monthly_amount` column on the contract will store the per-installment amount (not per-month), keeping existing billing automation compatible since it processes installments by `due_date`

