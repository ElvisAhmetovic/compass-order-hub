

## Synchronize Monthly Packages with Invoice & Payment Reminder System

### Problem
Monthly Packages operates in isolation. When an invoice is created/sent from Monthly Packages, it does not:
1. Set the invoice status to `sent` (stays `draft`)
2. Activate the automated payment reminder countdown (`next_reminder_at`)
3. Sync the "Paid" toggle back to the linked invoice when marked paid in Monthly Packages
4. Sync the "Invoice Sent" toggle to the invoice status
5. Load existing invoices already linked to installments (only tracks in-memory `createdInvoices` state)

### Changes

**1. `src/components/monthly/SendMonthlyInvoiceDialog.tsx`** — When invoice is sent:
- After creating/finding the invoice, update its status to `sent`
- Set `next_reminder_at = now + 48h` to activate the automated payment reminder countdown
- This makes it behave identically to invoices sent from the Invoices page or Dashboard

```typescript
// After the installment update, before fire-and-forget email:
await supabase
  .from('invoices')
  .update({
    status: 'sent',
    next_reminder_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  })
  .eq('id', currentInvoice.id);
```

**2. `src/components/monthly/MonthlyInstallmentsTable.tsx`** — Paid toggle sync:
- When `handleToggleStatus` marks an installment as `paid`, check if it has a linked `invoice_id` and update that invoice to `paid` + clear `next_reminder_at`
- When toggling back to `unpaid`, set invoice back to `sent` + re-enable reminders
- On component mount, load existing `invoice_id` values from installments into state so the UI knows which installments already have invoices

**3. `src/services/monthlyContractService.ts`** — Add `invoice_id` to the `MonthlyInstallment` interface (it exists in DB but is missing from the TypeScript type)

**4. `src/components/monthly/MonthlyInstallmentsTable.tsx`** — Invoice Sent toggle sync:
- When `handleToggleEmailSent` is toggled ON, if there's a linked invoice, update its status to `sent` + set `next_reminder_at`
- When toggled OFF, set invoice back to `draft` + clear `next_reminder_at`

### Flow after changes

```text
Monthly Packages: "Send Invoice" button
  → Invoice created (if needed) with status 'sent'
  → next_reminder_at = now + 48h  ← ACTIVATES REMINDER SYSTEM
  → Installment marked email_sent = true, invoice_id linked
  → PDF sent to client

Monthly Packages: "Paid" toggle ON
  → Installment payment_status = 'paid'
  → Linked invoice status → 'paid', next_reminder_at → null
  → Reminders STOP

Monthly Packages: "Paid" toggle OFF
  → Installment payment_status = 'unpaid'
  → Linked invoice status → 'sent', next_reminder_at → now + 48h
  → Reminders RESTART

Invoices page: status change on monthly invoice
  → Works exactly as before (existing sync logic handles it)
```

### Files to modify
1. `src/services/monthlyContractService.ts` — Add `invoice_id` to interface
2. `src/components/monthly/SendMonthlyInvoiceDialog.tsx` — Set invoice status to `sent` + activate reminders on send
3. `src/components/monthly/MonthlyInstallmentsTable.tsx` — Sync paid/unpaid and invoice-sent toggles to linked invoice; load existing invoice links on mount

