

## QA Analysis: Monthly Packages ↔ Dashboard ↔ Invoices ↔ Offers Integration

### Current State Summary

After reviewing the codebase, I've identified what works and what's broken in the cross-system synchronization.

### What Already Works

1. **Dashboard → Invoices**: Toggling "Invoice Sent" or "Invoice Paid" on an order syncs to the linked invoice (by `order_id`), including reminder activation/deactivation.
2. **Invoices → Dashboard**: Changing invoice status on the Invoices page syncs back to the order's `status_invoice_sent` / `status_invoice_paid` flags (via `order_id` lookup).
3. **Monthly → Invoices (forward)**: Paid/Unpaid and Invoice Sent toggles in MonthlyInstallmentsTable update the linked invoice's status and `next_reminder_at`.
4. **Monthly → Invoice creation**: SendMonthlyInvoiceDialog auto-creates clients and invoices, links them via `invoice_id`, sets status to `sent`, and activates the 48h reminder countdown.
5. **Offers → Order creation**: Confirmed offers auto-create orders in the dashboard.
6. **Offer emails → Team**: Team receives exact copies of offer emails.

### Issues Found

#### Issue 1 — No reverse sync from Invoices page → Monthly Installments
When someone marks a monthly-linked invoice as `paid` on the Invoices page, the monthly installment's `payment_status` stays `unpaid`. There's no code that checks if a changed invoice is linked to a `monthly_installments` row and updates it accordingly.

**Fix**: In `src/pages/Invoices.tsx` `handleUpdateStatus`, after the existing order sync block, add a reverse sync to `monthly_installments`: look up any installment where `invoice_id = invoiceId` and update `payment_status` / `email_sent` accordingly.

#### Issue 2 — Monthly invoices have no `order_id`
Invoices created from Monthly Packages don't set `order_id`, so the existing Invoices ↔ Dashboard bi-directional sync doesn't apply to them. This is expected behavior (monthly contracts aren't dashboard orders), but it means the automated payment reminder edge function may try to look up an order and fail.

**Fix**: In `supabase/functions/send-invoice-payment-reminders/index.ts`, ensure the order validation check (which skips deleted/cancelled orders) gracefully handles `order_id = null` — treating null as "no order constraint, proceed with reminder". Currently needs verification.

#### Issue 3 — `handleCreateInvoice` in MonthlyInstallmentsTable doesn't link `invoice_id` to installment
The "Create Invoice" button (`handleCreateInvoice`) creates an invoice and stores it in local React state (`createdInvoices`), but does NOT update the `monthly_installments` DB row with `invoice_id`. Only `SendMonthlyInvoiceDialog` does. This means if you create an invoice but don't immediately send it, the link is lost on page refresh.

**Fix**: After successful invoice creation in `handleCreateInvoice`, update the installment row: `supabase.from('monthly_installments').update({ invoice_id: invoice.id }).eq('id', inst.id)`, and also update `invoiceIdMap` state.

### Implementation Plan

**File 1: `src/pages/Invoices.tsx`** — Add monthly installment reverse sync

In `handleUpdateStatus`, after the existing order sync block (around line 152), add:
```typescript
// Sync status to linked monthly installment
try {
  const { data: linkedInstallment } = await supabase
    .from('monthly_installments')
    .select('id')
    .eq('invoice_id', id)
    .maybeSingle();
  
  if (linkedInstallment) {
    const installmentUpdate: any = {};
    if (newStatus === 'paid') {
      installmentUpdate.payment_status = 'paid';
      installmentUpdate.paid_at = new Date().toISOString();
    } else if (newStatus === 'sent') {
      installmentUpdate.payment_status = 'unpaid';
      installmentUpdate.paid_at = null;
      installmentUpdate.email_sent = true;
      installmentUpdate.email_sent_at = new Date().toISOString();
    } else if (newStatus === 'draft') {
      installmentUpdate.payment_status = 'unpaid';
      installmentUpdate.paid_at = null;
      installmentUpdate.email_sent = false;
      installmentUpdate.email_sent_at = null;
    }
    if (Object.keys(installmentUpdate).length > 0) {
      await supabase.from('monthly_installments').update(installmentUpdate).eq('id', linkedInstallment.id);
    }
  }
} catch (err) {
  console.error("Error syncing invoice status to monthly installment:", err);
}
```

**File 2: `src/components/monthly/MonthlyInstallmentsTable.tsx`** — Fix `handleCreateInvoice` to persist `invoice_id`

After the invoice is created successfully (around line 159), add DB update:
```typescript
// Persist the invoice_id link to the installment row
await supabase
  .from('monthly_installments')
  .update({ invoice_id: invoice.id })
  .eq('id', inst.id);

setInvoiceIdMap(prev => ({ ...prev, [inst.id]: invoice.id }));
```

**File 3: `supabase/functions/send-invoice-payment-reminders/index.ts`** — Verify null `order_id` handling

Check that the order validation step doesn't skip invoices with `order_id = null`. If it does, add a null guard so monthly invoices still receive automated reminders.

### Files to modify
1. `src/pages/Invoices.tsx` — Add reverse sync to monthly installments
2. `src/components/monthly/MonthlyInstallmentsTable.tsx` — Persist `invoice_id` on "Create Invoice"
3. `supabase/functions/send-invoice-payment-reminders/index.ts` — Ensure null `order_id` doesn't block reminders

