

## Add "Invoice Sent" Toggle to Monthly Installment Rows

The `monthly_installments` table already has an `email_sent` (boolean) and `email_sent_at` (timestamp) column. Currently, this is displayed as a read-only badge. The plan is to make it a toggleable switch, just like the "Paid" toggle.

### Changes

**File: `src/services/monthlyContractService.ts`**
- Add a `toggleEmailSent(installmentId, newStatus)` method that updates `email_sent` and `email_sent_at` on `monthly_installments`

**File: `src/components/monthly/MonthlyInstallmentsTable.tsx`**
1. Replace the read-only Email badge (line 302-303) with a `Switch` toggle
2. Add state tracking for toggling email sent IDs (like `togglingIds` for payment)
3. Add a `handleToggleEmailSent` handler that calls the new service method
4. Update the table header from "Email" to "Invoice Sent"

No database changes needed — the `email_sent` and `email_sent_at` columns already exist with proper RLS policies.

