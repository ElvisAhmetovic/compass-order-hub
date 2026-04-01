

## Fix: Wrong Client Matched When Creating Invoice from Monthly Package

### Problem
Same root cause as the previous report: when creating an invoice from a monthly contract, the code matches clients by **email only** (lines 124 and 189 in `MonthlyInstallmentsTable.tsx`). Multiple companies share the same email address, so `.find()` returns the first match — the wrong client.

This caused "N V G" to get "Eschertoren"'s client record, and earlier "Nasir Ahmad" got "24h Kanal"'s record.

### Fix
**File: `src/components/monthly/MonthlyInstallmentsTable.tsx`**

Update both client-matching locations (lines 124 and 189) to match by **email + name** first, then fall back to email-only:

```typescript
// Try exact match by email AND name
let matched = clients.find(c => 
  c.email.toLowerCase() === contract.client_email.toLowerCase() &&
  c.name.toLowerCase() === contract.client_name.toLowerCase()
);

// Fallback: email only
if (!matched) {
  matched = clients.find(c => c.email.toLowerCase() === contract.client_email.toLowerCase());
}

// If still no match, create new client (existing behavior)
if (!matched) {
  matched = await InvoiceService.createClient({ ... });
}
```

Apply this pattern at both:
1. **Line 124** — `handleCreateInvoice`
2. **Line 189** — `handleOpenSendDialog`

### Files to modify
1. `src/components/monthly/MonthlyInstallmentsTable.tsx` — Two client-matching blocks

