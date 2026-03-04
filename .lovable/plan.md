

## Differentiate Emojis for Invoice Sent vs Invoice Paid in Monthly Emails

### Problem
Both "Invoice Sent" and "Payment Paid" use the same ✅ emoji, making it hard to distinguish at a glance in email notifications.

### Change

**`supabase/functions/send-monthly-toggle-notification/index.ts`** (lines 58-59)

Use distinct emojis:
- **Payment Paid**: ✅ (keep as-is) / Unpaid: ❌ (keep)
- **Invoice Sent**: 📨 / Not Sent: ❌ (keep)

```typescript
// Before
toggleType === "paid"
  ? newValue ? "Payment marked as Paid ✅" : "Payment marked as Unpaid ❌"
  : newValue ? "Invoice marked as Sent ✅" : "Invoice marked as Not Sent ❌";

// After
toggleType === "paid"
  ? newValue ? "Payment marked as Paid ✅" : "Payment marked as Unpaid ❌"
  : newValue ? "Invoice marked as Sent 📨" : "Invoice marked as Not Sent ❌";
```

Single line change, deploy edge function.

