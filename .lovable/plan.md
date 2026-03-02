

## Fix: Remove Duplicate Team Notification Loop from SendMonthlyInvoiceDialog

The `send-invoice-pdf` edge function already sends team notifications after delivering the client email. But `SendMonthlyInvoiceDialog.tsx` also loops through all 12 team emails client-side, sending the full PDF to each one sequentially with 500ms delays. This causes:
1. ~12 extra edge function calls (each ~15s with the full PDF payload)
2. The dialog stays stuck on "Sending..." for minutes
3. Duplicate notifications to the team

### Fix

In `SendMonthlyInvoiceDialog.tsx`, remove the entire `for` loop (lines ~193-208) that iterates over `NOTIFICATION_EMAIL_LIST` and sends `[Team Copy]` emails. The edge function already handles this.

Also remove the `NOTIFICATION_EMAIL_LIST` import since it's no longer needed.

### File to Modify

| File | Change |
|------|--------|
| `src/components/monthly/SendMonthlyInvoiceDialog.tsx` | Remove the team notification loop and the `NOTIFICATION_EMAIL_LIST` import |

