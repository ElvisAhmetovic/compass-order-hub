

## Apply Email+Name Client Matching Across All Monthly Package Code

### Problem
The fix was only applied to `MonthlyInstallmentsTable.tsx`. But `SendMonthlyInvoiceDialog.tsx` (line 76) still matches clients by **email only**, causing the same wrong-client bug when sending invoices from that dialog.

### Fix
**File: `src/components/monthly/SendMonthlyInvoiceDialog.tsx`** (line 76)

Replace the email-only match:
```typescript
currentClient = clients.find(c => c.email.toLowerCase() === contract.client_email.toLowerCase()) || null;
```

With email+name priority matching:
```typescript
currentClient = clients.find(c => 
  c.email.toLowerCase() === contract.client_email.toLowerCase() &&
  c.name.toLowerCase() === contract.client_name.toLowerCase()
) || null;

if (!currentClient) {
  currentClient = clients.find(c => c.email.toLowerCase() === contract.client_email.toLowerCase()) || null;
}
```

### Files to modify
1. `src/components/monthly/SendMonthlyInvoiceDialog.tsx` — Update client matching (line 76)

