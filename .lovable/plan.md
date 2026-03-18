

## Change: Reminder Interval from 24h to 48h

Five places need `24 * 60 * 60 * 1000` changed to `48 * 60 * 60 * 1000`:

1. **`src/services/orderService.ts`** (line 742) — status toggle trigger
2. **`src/pages/Invoices.tsx`** (line 126) — status dropdown trigger
3. **`src/components/invoices/SendInvoiceDialog.tsx`** (line 125) — manual send trigger
4. **`src/components/invoices/SendInvoicePDFDialog.tsx`** (line 89) — PDF send trigger
5. **`supabase/functions/send-invoice-payment-reminders/index.ts`** (line 283) — recurring next reminder

All straightforward find-and-replace of `24 * 60 * 60 * 1000` → `48 * 60 * 60 * 1000` in these reminder-specific lines only (not touching unrelated 24h usages like payment expiry or due dates).

