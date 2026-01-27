
# Client Portal Integration Plan

## Current Architecture Analysis

### Existing Role System
Your application currently uses 3 roles stored in the `profiles` table:
- **admin** - Full access to all features and data
- **agent** - Access to most operational features, sees their assigned orders
- **user** - Limited access, used for internal team members

**Current Implementation:**
- Roles are stored in `profiles.role` column (NOT in a separate `user_roles` table as per security best practices)
- `AuthContext.tsx` fetches roles from the profiles table on login
- `AdminGuard.tsx` restricts admin-only routes
- `Sidebar.tsx` filters navigation items based on role

### Orders-User Relationship
Orders currently link to internal users via:
- `created_by` (UUID) - who created the order
- `assigned_to` (UUID) - internal staff assigned to the order
- `assigned_to_name` (text) - display name of assignee
- `company_id` (UUID) - links to the companies table

**There is NO client user linking mechanism currently** - orders reference company data but not client user accounts.

### Companies Table
Companies have a `user_id` column (nullable) but it's used for internal user ownership, not client portal access.

---

## Proposed Architecture: "Client" Role Addition

### 1. Role System Upgrade (Safe Approach)

**Minimal Change Strategy:**
We will add `"client"` as a 4th valid role value to the existing `profiles.role` column. This is the safest approach because:
- No changes to existing admin/agent/user functionality
- Uses existing authentication infrastructure
- Existing RLS policies continue to work

```text
Old roles: "admin" | "agent" | "user"
New roles: "admin" | "agent" | "user" | "client"
```

**TypeScript Type Update:**
```typescript
// src/types/index.ts
export type UserRole = "admin" | "agent" | "user" | "client";
```

### 2. Client-Order Linking Strategy

**Option A: Use `company_id` Linking (Recommended)**
Link client users to companies, then show orders that belong to those companies.

New columns needed:
- Add `client_user_id` to `companies` table to link a company to a client user account

**Data Flow:**
```text
Client User → profiles.id → companies.client_user_id → companies.id → orders.company_id → Orders
```

**Option B: Direct Order Linking (Not Recommended)**
Add `client_user_id` directly to orders table. This creates data duplication and is harder to maintain.

### 3. New Database Changes

```sql
-- Add client_user_id to companies table to link companies to client portal users
ALTER TABLE companies 
ADD COLUMN client_user_id UUID REFERENCES auth.users(id);

-- Create index for efficient client lookups
CREATE INDEX idx_companies_client_user_id ON companies(client_user_id);

-- Create a view for client-accessible order data (hides internal notes, agent info)
CREATE VIEW client_orders WITH (security_invoker=on) AS
SELECT 
  o.id,
  o.company_name,
  o.description,
  o.status,
  o.created_at,
  o.updated_at,
  o.price,
  o.currency,
  o.priority,
  o.status_created,
  o.status_in_progress,
  o.status_invoice_sent,
  o.status_invoice_paid,
  o.status_resolved,
  o.status_cancelled,
  c.id as company_id,
  c.client_user_id
FROM orders o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.deleted_at IS NULL AND o.status_deleted = false;
```

**RLS Policies for Client Access:**
```sql
-- Allow clients to view their company's orders
CREATE POLICY "Clients can view their company orders"
  ON client_orders FOR SELECT
  USING (
    client_user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'client'
    )
  );
```

### 4. Client Portal Routes (Completely Isolated)

New routes that won't touch existing admin functionality:

```text
/client                    → Client login landing
/client/dashboard          → Client's order overview
/client/orders             → List of their orders
/client/orders/:id         → Order detail (read-only)
/client/invoices           → Their invoices
/client/support            → Client support tickets
/client/profile            → Client profile settings
```

**Route Protection Pattern:**
```typescript
// New ClientGuard component
const ClientGuard = ({ children }) => {
  const { user } = useAuth();
  
  if (!user || user.role !== 'client') {
    return <Navigate to="/client/login" />;
  }
  
  return <>{children}</>;
};
```

### 5. Component Structure (New Files Only)

```text
src/
├── components/
│   └── client-portal/           # NEW - All client portal components
│       ├── ClientLayout.tsx     # Separate layout from admin
│       ├── ClientSidebar.tsx    # Client navigation
│       ├── ClientHeader.tsx     # Client header
│       ├── ClientOrderCard.tsx  # Order display component
│       ├── ClientOrderList.tsx  # Orders list view
│       └── ClientGuard.tsx      # Client route protection
├── pages/
│   └── client/                  # NEW - All client portal pages
│       ├── ClientDashboard.tsx
│       ├── ClientOrders.tsx
│       ├── ClientOrderDetail.tsx
│       ├── ClientInvoices.tsx
│       ├── ClientSupport.tsx
│       └── ClientLogin.tsx      # Optional: Separate login page
└── services/
    └── clientOrderService.ts    # NEW - Client-specific data fetching
```

---

## What Will NOT Change (Preserving Existing Functionality)

| Component | Status | Reason |
|-----------|--------|--------|
| `/dashboard` route | Unchanged | Admin/agent only |
| `AdminGuard.tsx` | Unchanged | Still checks for `role === 'admin'` |
| `AuthGuard.tsx` | Unchanged | Still protects admin routes |
| `Sidebar.tsx` | Unchanged | Already filters by role |
| `OrderService.ts` | Unchanged | New service for clients |
| `OrderTable.tsx` | Unchanged | Admin-only component |
| All RLS policies | Unchanged | New policies added, none modified |
| `profiles` table | Minimal change | Just allows 'client' as valid role |

---

## Implementation Phases

### Phase 1: Database Foundation (Safe)
1. Add `client_user_id` column to `companies` table
2. Create `client_orders` view with limited columns
3. Add RLS policies for client access

### Phase 2: Authentication Updates (Minimal)
1. Update `UserRole` type to include `"client"`
2. Create `ClientGuard.tsx` component
3. Create client login flow (or reuse existing login with redirect logic)

### Phase 3: Client Portal UI (New Files Only)
1. Create `ClientLayout.tsx` with separate navigation
2. Create `ClientDashboard.tsx` page
3. Create `ClientOrderList.tsx` and `ClientOrderDetail.tsx`
4. Add routes to `App.tsx` under `/client/*`

### Phase 4: Admin Features for Client Management
1. Add "Invite Client" button in Companies view
2. Create client user management in Admin settings
3. Add ability to link existing company to client user

---

## Security Considerations

1. **Role Isolation**: Clients cannot access admin routes due to:
   - `ClientGuard` only allowing `role === 'client'`
   - Existing guards blocking non-admin access
   
2. **Data Isolation**: Clients only see their data via:
   - RLS policies checking `client_user_id = auth.uid()`
   - `client_orders` view hiding internal notes and agent info
   
3. **No Shared Components**: Client portal uses entirely new components, preventing accidental data leakage

---

## Technical Summary

| Item | Current State | After Implementation |
|------|---------------|---------------------|
| Role types | admin, agent, user | admin, agent, user, client |
| profiles table | No changes | Accepts 'client' role value |
| companies table | user_id (internal) | + client_user_id (portal access) |
| orders table | No changes | Accessed via view for clients |
| Admin routes | Protected | Unchanged (still protected) |
| Client routes | Don't exist | New `/client/*` namespace |
| RLS policies | Admin/agent focused | + New client-specific policies |

