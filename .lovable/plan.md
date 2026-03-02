

## Fix: Send Invoice Should Auto-Create Invoice If Missing

The "Send Invoice" button currently requires you to first click "Create Invoice" — the send button is disabled and shows an error if no invoice exists. This should be seamless: clicking Send Invoice should auto-create the invoice in the background if one hasn't been created yet.

### Changes to `src/components/monthly/SendMonthlyInvoiceDialog.tsx`

1. **Remove the `!invoice` guard** — Instead of blocking with "Please create an invoice first", auto-create the invoice on send
2. **Add auto-creation logic in `handleSend`** — If `invoice` is null, create one using `InvoiceService.createInvoice()` with the same VAT-inclusive logic from `MonthlyInstallmentsTable`
3. **Enable the Send button** — Remove `!invoice` from the disabled condition so users can always click Send
4. **Import `InvoiceService`** (already imported) and use the `client` prop to get `client_id`
5. If `client` is also null, auto-create the client first (same pattern as the table)

The flow becomes: click Send → auto-create invoice if needed → generate PDF → send email → done.

### File to Modify

| File | Change |
|------|--------|
| `src/components/monthly/SendMonthlyInvoiceDialog.tsx` | Remove invoice null guard, add auto-create invoice logic in handleSend, enable send button always |

