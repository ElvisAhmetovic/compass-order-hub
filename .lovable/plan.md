

## Remove Auto-Creation of Blank Orders from Sync

### Problem
`CompanySyncService.syncClientsToCompanies()` creates €0 placeholder orders for every invoice client without a matching dashboard order, polluting the dashboard.

### Changes

**1. `src/services/companySyncService.ts`**
- Remove the `syncClientsToCompanies()` method entirely
- Update `performFullSync()` to only call `syncCompaniesToClients()` (one-direction sync)
- Update the toast description to reflect the one-way sync

**2. `src/pages/Clients.tsx`**
- Remove the `syncClientsToCompanies()` calls in `handleClientCreated` (line 105) and `handleClientUpdated` (line 115)
- In `loadClients`, keep the `performFullSync()` call — it will now only do companies→clients
- The "Sync with Companies" button (line 142) stays, now only syncs one direction

**3. `src/pages/Companies.tsx`** — Update the confirmation dialog text
- Remove bullet point #3 about creating placeholder orders, since that no longer happens

### Files
- **Modify**: `src/services/companySyncService.ts`
- **Modify**: `src/pages/Clients.tsx`
- **Modify**: `src/pages/Companies.tsx`

