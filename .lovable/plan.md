

## Fix: Update installment `email_sent` status after manual invoice send

### Problem

After manually sending an invoice via the Send Invoice dialog in Monthly Packages, the `email_sent` column on the `monthly_installments` row is never updated. The table reads `inst.email_sent` (line 303) to show "Sent" vs "Pending", so it stays "Pending" forever.

Additionally, the dialog doesn't call `onRefresh` after success, so even if we update the DB, the UI wouldn't reflect it without a manual page reload.

### Changes

**File: `src/components/monthly/SendMonthlyInvoiceDialog.tsx`**

1. After the successful `send-invoice-pdf` call (line 191), update the installment record in Supabase:
   ```ts
   await supabase
     .from('monthly_installments')
     .update({
       email_sent: true,
       email_sent_at: new Date().toISOString(),
       invoice_id: currentInvoice.id,
     })
     .eq('id', installment.id);
   ```

2. Add an `onRefresh` callback prop to the dialog so the parent table re-fetches data after sending

**File: `src/components/monthly/MonthlyInstallmentsTable.tsx`**

1. Pass `onRefresh` to the `SendMonthlyInvoiceDialog` component

### Summary

| What | Before | After |
|------|--------|-------|
| `email_sent` field | Never updated on manual send | Set to `true` after successful send |
| `invoice_id` field | Never linked on manual send | Linked to created invoice |
| UI refresh | Stays stale after send | Auto-refreshes via `onRefresh` |

