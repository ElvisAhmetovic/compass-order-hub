

# Client Notes (Privacy Filter) Implementation Plan

## Overview
Add a new "Client Visible Update" feature that allows admins to write high-level updates specifically for clients, while ensuring sensitive internal data (`internal_notes`, `profit_margin`, `assigned_to`, etc.) remains hidden from the client view.

---

## Current Security Architecture

### What Clients CAN See (via `client_orders` view):
- Order identifiers: `id`, `company_name`, `description`, `status`
- Status flags: `status_created`, `status_in_progress`, etc.
- Financials: `price`, `currency`
- Contact: `contact_email`, `contact_phone`
- Timestamps: `created_at`, `updated_at`

### What Clients CANNOT See (excluded from view):
- `internal_notes` - Already hidden (internal team notes)
- `assigned_to`, `assigned_to_name` - Internal assignment
- `inventory_items` - Internal product details
- `created_by`, `agent_name` - Internal staff info
- Any future sensitive columns like `profit_margin`

This plan maintains this security model while adding a new client-visible field.

---

## Implementation Plan

### Phase 1: Database Schema Update

**Add new column to `orders` table:**

```sql
ALTER TABLE public.orders
ADD COLUMN client_visible_update TEXT DEFAULT NULL;

COMMENT ON COLUMN public.orders.client_visible_update 
IS 'High-level status update visible to clients. Admin-editable only.';
```

**Update `client_orders` view to include the new column:**

```sql
DROP VIEW IF EXISTS public.client_orders;

CREATE VIEW public.client_orders WITH (security_invoker=on) AS
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
    o.contact_email,
    o.contact_phone,
    o.client_id,
    o.client_visible_update,  -- NEW: Client-facing update note
    c.id AS company_id,
    c.client_user_id,
    c.name AS linked_company_name,
    c.email AS company_email
FROM orders o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.deleted_at IS NULL 
  AND (o.status_deleted = false OR o.status_deleted IS NULL);
```

**Key Security Point:** The view continues to explicitly exclude:
- `internal_notes`
- `assigned_to` / `assigned_to_name`
- `inventory_items`
- `created_by` / `agent_name`
- `amount` (if used as profit tracking)

---

### Phase 2: Update TypeScript Types

**Modify: `src/types/index.ts`**

Add to Order interface:
```typescript
export interface Order {
  // ... existing fields ...
  client_visible_update?: string;  // Client-facing status update
}
```

**Modify: `src/services/clientOrderService.ts`**

Add to ClientOrder interface:
```typescript
export interface ClientOrder {
  // ... existing fields ...
  client_visible_update: string | null;  // Status update from admin
}
```

---

### Phase 3: Admin UI - Edit Client Update

**Modify: `src/components/dashboard/OrderEditForm/OrderDetailsSection.tsx`**

Add a new "Client Update" textarea section between Description and Internal Notes:

```text
Current Layout:
1. Description (visible to client)
2. Internal Notes (hidden from client)
3. Inventory Items
4. Price, Currency, Priority...

New Layout:
1. Description (visible to client)
2. 📢 Client Update (NEW - visible to client, highlighted)
3. 🔒 Internal Notes (hidden from client)
4. Inventory Items
5. Price, Currency, Priority...
```

**UI Design for Client Update section:**
- Label: "📢 Client Update" with a badge "Visible to Client"
- Help text: "This message will be displayed to the client in their portal. Use it for high-level status updates."
- Highlighted border (blue/info color) to distinguish from internal notes
- Textarea with placeholder suggesting content: "e.g., 'Your order is progressing well! We've completed the initial review and are now in the production phase.'"

**Modify: `src/components/dashboard/OrderEditForm/useOrderEdit.ts`**

Add `client_visible_update` to the form data interface and save handler.

---

### Phase 4: Client Portal - Display Update Prominently

**Modify: `src/pages/client/ClientOrderDetail.tsx`**

Add a prominent "Latest Update" card at the top of the order details, before the main order info:

```text
Page Layout (if client_visible_update exists):
┌─────────────────────────────────────────────────┐
│ 📢 Latest Update from [Company]                 │
│ ───────────────────────────────────             │
│ "Your order is progressing well! We've          │
│  completed the initial review and are now       │
│  in the production phase."                      │
│                                                 │
│ Last updated: Jan 27, 2026                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Order Details Card (existing)                   │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Card with info/primary color accent
- Megaphone or Bell icon
- Prominent placement at the very top
- Timestamp showing when the update was last modified
- Only rendered if `client_visible_update` has content

**Modify: `src/components/client-portal/ClientOrderCard.tsx`**

Add a small indicator on the order card if there's a client update:
- Small badge or icon showing "📢 Update available"
- Truncated preview of the update text (first 50 chars)

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| Database Migration | Create | Add `client_visible_update` column and update `client_orders` view |
| `src/types/index.ts` | Modify | Add `client_visible_update` to Order interface |
| `src/services/clientOrderService.ts` | Modify | Add `client_visible_update` to ClientOrder interface |
| `OrderDetailsSection.tsx` | Modify | Add Client Update textarea with "Visible to Client" indicator |
| `useOrderEdit.ts` | Modify | Include `client_visible_update` in form handling |
| `ClientOrderDetail.tsx` | Modify | Add prominent "Latest Update" card |
| `ClientOrderCard.tsx` | Modify | Add update indicator on order cards |

---

## Security Verification

After implementation, verify these security constraints:

| Column | Orders Table | client_orders View | Client Can See |
|--------|--------------|-------------------|----------------|
| `internal_notes` | Yes | **No** | **No** |
| `assigned_to` | Yes | **No** | **No** |
| `assigned_to_name` | Yes | **No** | **No** |
| `inventory_items` | Yes | **No** | **No** |
| `created_by` | Yes | **No** | **No** |
| `agent_name` | Yes | **No** | **No** |
| `client_visible_update` | Yes | **Yes** | **Yes** |
| `description` | Yes | Yes | Yes |
| `price` | Yes | Yes | Yes |

The `client_orders` view acts as a privacy filter, only exposing client-safe fields.

---

## Files to Create/Modify

### Database:
1. Migration to add `client_visible_update` column
2. Migration to recreate `client_orders` view with new column

### Frontend:
1. `src/types/index.ts` - Add field to Order interface
2. `src/services/clientOrderService.ts` - Add field to ClientOrder interface
3. `src/components/dashboard/OrderEditForm/OrderDetailsSection.tsx` - Add admin textarea
4. `src/components/dashboard/OrderEditForm/useOrderEdit.ts` - Include in form handling
5. `src/pages/client/ClientOrderDetail.tsx` - Display prominent update card
6. `src/components/client-portal/ClientOrderCard.tsx` - Add update indicator

