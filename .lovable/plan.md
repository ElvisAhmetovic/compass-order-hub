

## Fix: Dashboard Invoice Status Sync Not Updating

### Root Cause
When toggling "Invoice Paid" on the dashboard, `OrderService.toggleOrderStatus` calls `InvoiceService.updateInvoice` which goes through an abstraction layer. The DB confirms the invoice (INV-2026-501) remained at status `sent` even though the order shows `status_invoice_paid: true`. The update call is likely silently failing (returning empty data without throwing an error) or the dynamic import is causing an issue.

### Fix
Replace the indirect `InvoiceService.updateInvoice` call with a direct `supabase.from('invoices').update()` call, and add diagnostic logging before and after.

### File: `src/services/orderService.ts` (lines ~793-804)

Replace:
```typescript
const updateData: Record<string, any> = { status: newInvoiceStatus };
if (newInvoiceStatus === 'sent') {
  updateData.next_reminder_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
} else {
  updateData.next_reminder_at = null;
}
await InvoiceService.updateInvoice(linkedInvoice.id, updateData);
console.log(`📄 Synced invoice ${linkedInvoice.invoice_number} status to "${newInvoiceStatus}"`);
```

With a direct Supabase call + verification:
```typescript
const updateData: Record<string, any> = { 
  status: newInvoiceStatus,
  updated_at: new Date().toISOString()
};
if (newInvoiceStatus === 'sent') {
  updateData.next_reminder_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
} else {
  updateData.next_reminder_at = null;
}

console.log(`📄 Updating invoice ${linkedInvoice.id} (${linkedInvoice.invoice_number}) to status "${newInvoiceStatus}"`, updateData);

const { data: updateResult, error: invoiceUpdateError } = await supabase
  .from('invoices')
  .update(updateData)
  .eq('id', linkedInvoice.id)
  .select('id, status, next_reminder_at');

if (invoiceUpdateError) {
  console.error('📄 Invoice update error:', invoiceUpdateError);
} else if (!updateResult?.length) {
  console.error('📄 Invoice update returned no rows — possible RLS issue. Retrying with service-level approach...');
  // Fallback: try updating without .select() 
  const { error: retryError } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', linkedInvoice.id);
  if (retryError) {
    console.error('📄 Invoice update retry failed:', retryError);
  } else {
    console.log('📄 Invoice update retry succeeded (no select verification)');
  }
} else {
  console.log(`📄 Synced invoice ${linkedInvoice.invoice_number} to "${updateResult[0].status}"`);
}
```

Also apply the same direct-update approach to the auto-create path (line ~866-875) — replace `InvoiceService.updateInvoice` there too with a direct supabase call + logging.

### Files to modify
1. `src/services/orderService.ts` — Replace InvoiceService.updateInvoice calls with direct supabase updates + logging in both the "update existing" and "auto-create" invoice sync paths

