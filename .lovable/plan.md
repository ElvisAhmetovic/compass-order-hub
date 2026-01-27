

# Admin "Client Access" Section Implementation Plan

## Overview
Add a "Client Access" section to the internal Admin Order Detail page (`OrderModal.tsx`) that allows admins to link client users to specific orders and send mock invites. This section will only be visible to users with the `admin` role.

---

## Current State Analysis

### What Already Exists:
- **`OrderModal.tsx`**: The main admin order detail modal with tabs (Details, Activity, Collaboration, Email History)
- **`client_id` column on orders table**: Already exists in the database to link orders to client users
- **`user_roles` table**: Contains roles including the `client` role
- **`has_role()` function**: Security definer function for role checking
- **Admin check in modal**: `const isAdmin = userRole === "admin"` already exists on line 64

### What's Missing:
1. **Client users fetch**: No existing service to fetch only client-role users
2. **Client assignment UI**: No dropdown/section to select and link clients to orders
3. **Invite functionality**: No button to generate/send client access invite
4. **`client_id` update service**: OrderService needs method to update the client_id field

---

## Implementation Plan

### Phase 1: Create Client Access Service

**New file: `src/services/clientAccessService.ts`**

Service functions needed:
```typescript
// Fetch all users with 'client' role for dropdown
async function getClientUsers(): Promise<{id: string, name: string, email: string}[]>

// Link a client to an order by updating client_id
async function linkClientToOrder(orderId: string, clientId: string): Promise<void>

// Unlink client from order (set client_id to null)
async function unlinkClientFromOrder(orderId: string): Promise<void>
```

**Data Flow:**
```text
1. Fetch clients: user_roles (role='client') → JOIN profiles → Get id, name
2. Link client: UPDATE orders SET client_id = ? WHERE id = ?
3. Log activity: INSERT order_audit_logs with "Client Access Granted"
```

### Phase 2: Create ClientAccessSection Component

**New file: `src/components/dashboard/ClientAccessSection.tsx`**

**Component Structure:**
```text
┌─────────────────────────────────────────────────────────────┐
│  🔐 Client Access                           [Admin Only]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Client: [None / John Doe (john@client.com)]       │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │ Select Client ▾                     │  [Link Client]    │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  OR                                                         │
│                                                             │
│  [📧 Send Login Invite]  [❌ Remove Access]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
1. **Client Dropdown**: Select component listing all client-role users
2. **Link Button**: Links selected client to the order (updates `client_id`)
3. **Send Invite Button**: Mock action showing toast notification (future: real email)
4. **Remove Access Button**: Unlinks client (sets `client_id` to null)
5. **Current Client Display**: Shows currently linked client (if any)

**Props:**
```typescript
interface ClientAccessSectionProps {
  orderId: string;
  currentClientId: string | null;
  onClientLinked: () => void; // Callback to refresh order data
}
```

### Phase 3: Integrate into OrderModal

**Modify: `src/components/dashboard/OrderModal.tsx`**

Changes:
1. Import the new `ClientAccessSection` component
2. Add the section inside the "Order Details" tab, below the existing content
3. Only render when `isAdmin === true`
4. Pass `order.client_id` as current client (need to add `client_id` to Order type)

**Placement in modal:**
```text
<TabsContent value="details">
  ...existing content...
  
  {/* Client Access - Admin Only */}
  {isAdmin && (
    <div className="col-span-1 lg:col-span-2 pt-6 border-t border-border">
      <ClientAccessSection 
        orderId={order.id}
        currentClientId={order.client_id || null}
        onClientLinked={handleRefresh}
      />
    </div>
  )}
  
  ...emoji reactions...
</TabsContent>
```

### Phase 4: Update Order Type

**Modify: `src/types/index.ts`**

Add `client_id` field to Order interface:
```typescript
export interface Order {
  // ...existing fields...
  client_id?: string;  // UUID of linked client user
}
```

---

## Technical Details

### Files to Create:
1. `src/services/clientAccessService.ts` - Service for client access operations
2. `src/components/dashboard/ClientAccessSection.tsx` - UI component for admin

### Files to Modify:
1. `src/components/dashboard/OrderModal.tsx` - Add ClientAccessSection
2. `src/types/index.ts` - Add client_id to Order interface

### Database Queries:

**Fetch client users:**
```sql
SELECT p.id, p.first_name, p.last_name
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.role = 'client'
ORDER BY p.first_name, p.last_name;
```

**Get client email (for display):**
```sql
-- Use Supabase auth.users via admin API or store email in profiles
```

**Link client to order:**
```sql
UPDATE orders 
SET client_id = $clientId, updated_at = now()
WHERE id = $orderId;
```

---

## Component Dependencies

Uses existing shadcn/ui components:
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` - Client dropdown
- `Button` - Link, Invite, Remove actions
- `Card`, `CardHeader`, `CardContent` - Section container
- `Badge` - Show current client status
- `useToast` - Toast notifications

Icons from lucide-react:
- `UserPlus` - Add client
- `Mail` - Send invite
- `UserX` - Remove access
- `Shield` - Admin-only indicator

---

## Security Considerations

1. **Admin-Only Visibility**: Component only rendered when `userRole === "admin"`
2. **RLS Protection**: The orders table has existing RLS policies that allow admins to update
3. **Role Validation**: Client dropdown only fetches users with `role = 'client'` from `user_roles`
4. **Audit Trail**: All client linking/unlinking actions logged to `order_audit_logs`

---

## Mock Invite Behavior

For now, the "Send Login Invite" button will:
1. Show a success toast: "Login information sent to {client_email}"
2. Log the invite action to order_audit_logs
3. (Future enhancement: Connect to real email service)

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| clientAccessService.ts | Create | Service for fetching clients and linking orders |
| ClientAccessSection.tsx | Create | Admin-only UI for managing client access |
| OrderModal.tsx | Modify | Add ClientAccessSection in details tab |
| types/index.ts | Modify | Add client_id to Order interface |

---

## What Will NOT Change

- Overall layout of OrderModal (only adding new section)
- Existing order update functionality
- Non-admin user experience
- Other tabs in the modal (Activity, Collaboration, Email History)
- Any client portal components or routes

