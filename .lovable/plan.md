

## Save Offer Details to Autofill (Companies Sync)

### Problem
When you use "Send Offer" instead of "Create Order", the company/client details are saved to the `offers` table but never synced to the `companies` table. The autofill dropdown (`OrderSearchDropdown`) pulls from orders and companies, so offer-only clients never appear in autofill.

### Solution
After successfully inserting the offer into the `offers` table (line ~910 in `CreateOrderModal.tsx`), call `SupabaseCompanySyncService.syncOrderCompany()` with the offer data shaped as an order-like object. This reuses the existing company sync logic.

### Changes

**`src/components/dashboard/CreateOrderModal.tsx`** — In the "Send Offer" button's `onClick` handler (~line 910-936), after the offer is successfully saved to DB and email sent, add:

```typescript
// Sync offer company data to companies table for autofill
try {
  const { SupabaseCompanySyncService } = await import('@/services/supabaseCompanySyncService');
  await SupabaseCompanySyncService.syncOrderCompany({
    company_name: values.companyName.trim(),
    contact_email: values.contactEmail.trim(),
    contact_phone: values.contactPhone?.trim() || null,
    company_address: values.companyAddress?.trim() || null,
    company_link: values.companyLink || null,
  } as any);
} catch (syncErr) {
  console.error('Failed to sync offer company for autofill:', syncErr);
}
```

This is a ~10-line addition. No other files need changes since the sync service and autofill dropdown already work with the `companies` table.

