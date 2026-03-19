

## Add "Invoice automatically synced" Toast Notification

### Approach
Make `toggleOrderStatus` return metadata about what happened with the invoice sync, then show a follow-up toast in all 3 calling components.

### Changes

**1. `src/services/orderService.ts`**
- Change `toggleOrderStatus` return type to include invoice sync info
- After the invoice sync block (lines 714-836), track whether an invoice was updated, created, or nothing happened
- Return an object like `{ invoiceSynced: boolean, invoiceAction: 'updated' | 'created' | null, invoiceNumber?: string }`

**2. `src/components/dashboard/MultiStatusBadges.tsx`** (line ~78)
- Capture the return value from `toggleOrderStatus`
- If `invoiceSynced` is true, show a second toast: "Invoice automatically synced" with description based on action

**3. `src/components/dashboard/OrderRow.tsx`** (line ~289)
- Same pattern — capture return, show sync toast if applicable

**4. `src/components/dashboard/OrderActions.tsx`** (line ~230)
- Same pattern — capture return, show sync toast if applicable

### Example toast
```
title: "📄 Invoice automatically synced"
description: "Invoice #INV-001 marked as paid"  // or "New invoice created and marked as sent"
```

