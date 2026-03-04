

## Add Portal Status + Create Button to Monthly Packages

### Problem
The CreateClientPortalModal currently only works with `Order` objects. Monthly contracts have different fields and no `client_id` column for linking.

### Approach
1. **Refactor `CreateClientPortalModal`** to accept a generic data shape instead of requiring the `Order` type. Add a new prop interface that accepts `entityType: "order" | "contract"` so linking logic adapts accordingly.

2. **Add portal status + button to `MonthlyInstallmentsTable`** at the contract header level (next to the status badge), showing green/gray icon based on whether a client portal exists for that contract's `client_email`, plus a "Portal" button to open the modal.

### Changes

**`src/components/dashboard/CreateClientPortalModal.tsx`**
- Replace `order: Order` prop with a generic `entity` prop:
  ```ts
  interface PortalEntity {
    id: string;
    name: string;        // display name (company_name or client_name)
    contactName: string;  // pre-fill name
    contactEmail: string; // pre-fill email
    clientId?: string;    // existing client link (null for contracts)
    companyId?: string;   // optional company link
    entityType: "order" | "contract";
  }
  ```
- In `linkOrderToClient`: branch on `entityType` — for orders update `orders.client_id`, for contracts skip (no column to update, just log the action)
- In `logAction`: use `order_id` only when `entityType === "order"`, otherwise set `order_id` to null and put contract info in `details`

**`src/components/monthly/MonthlyInstallmentsTable.tsx`**
- Add state: `portalStatuses` map (contractId -> boolean) and `portalModalContract` (selected contract for modal)
- On mount/refresh: batch-check `app_users` for all unique contract emails to populate portal status
- In contract header row (between Badge and delete button): show `UserCheck` (green) or `UserX` (gray) icon + "Portal" button
- Render `CreateClientPortalModal` with entity mapped from the selected contract
- Import `UserCheck, UserX, KeyRound` from lucide-react

### Files
- **Modify**: `src/components/dashboard/CreateClientPortalModal.tsx`
- **Modify**: `src/components/monthly/MonthlyInstallmentsTable.tsx`
- **Modify**: `src/components/dashboard/OrderRow.tsx` (update to use new `PortalEntity` interface)

