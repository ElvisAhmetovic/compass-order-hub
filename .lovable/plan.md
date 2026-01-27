
# Call to Action Button Implementation Plan

## Overview
Add a prominent "Call to Action" system to the Client Portal that displays context-aware buttons based on order status. When an order requires client action (like "Awaiting-Client-Feedback"), show a prominent button linking to feedback/mockups. For orders "In Progress", show a progress bar instead.

---

## Current State Analysis

### Existing Infrastructure:
1. **Status Translator** (`src/utils/clientStatusTranslator.ts`): Already has `requiresAction: true` flag for "Awaiting-Client-Feedback" status
2. **ClientOrderCard**: Shows progress bars for orders but no action buttons
3. **ClientOrderDetail**: Shows order details but no action buttons
4. **No Action URL Field**: The `orders` table has no field for storing action/feedback URLs

### Components Affected:
- `ClientOrderCard.tsx` - Dashboard order cards
- `ClientOrderDetail.tsx` - Order detail page
- Admin order form - To set the action URL

---

## Implementation Plan

### Phase 1: Database Schema Update

**Add new column to `orders` table:**

```sql
ALTER TABLE public.orders
ADD COLUMN client_action_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.orders.client_action_url 
IS 'URL for client action (feedback forms, mockup links, etc.). Visible when status requires action.';
```

**Update `client_orders` view to include the new column:**

The `client_orders` view must be recreated to include `client_action_url` while continuing to exclude sensitive fields like `internal_notes`, `assigned_to`, etc.

---

### Phase 2: Update TypeScript Types

**Modify: `src/types/index.ts`**

```typescript
export interface Order {
  // ... existing fields ...
  client_action_url?: string;  // URL for client feedback/mockups
}
```

**Modify: `src/services/clientOrderService.ts`**

```typescript
export interface ClientOrder {
  // ... existing fields ...
  client_action_url: string | null;  // Action URL for feedback/mockups
}
```

---

### Phase 3: Admin UI - Set Action URL

**Modify: `src/components/dashboard/OrderEditForm/OrderDetailsSection.tsx`**

Add a new "Client Action URL" input field near the Client Update textarea:

```text
Layout within Client Update section:
┌─────────────────────────────────────────────────┐
│ 📢 Client Update                                │
│ [Textarea for status update message]            │
│                                                 │
│ 🔗 Client Action URL (optional)                 │
│ [Input field for feedback/mockup URL]           │
│ Help: "When status is 'Action Required', this   │
│        URL will appear as a button to clients"  │
└─────────────────────────────────────────────────┘
```

**Modify: `src/components/dashboard/OrderEditForm/useOrderEdit.ts`**

Add `client_action_url` to form state and save handler.

---

### Phase 4: Update Status Translator

**Modify: `src/utils/clientStatusTranslator.ts`**

Add action button configuration to the `ClientStatusConfig` interface:

```typescript
export interface ClientStatusConfig {
  label: string;
  emoji: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'action';
  badgeClassName?: string;
  progress: number;
  requiresAction?: boolean;
  actionButtonLabel?: string;  // NEW: Button text like "Provide Feedback" or "View Mockups"
}

// Update Awaiting-Client-Feedback entry:
"Awaiting-Client-Feedback": { 
  label: "Action Required", 
  emoji: "🕒", 
  badgeVariant: "action",
  badgeClassName: "bg-red-500 hover:bg-red-600 text-white",
  progress: 50,
  requiresAction: true,
  actionButtonLabel: "Provide Feedback"  // NEW
},
```

Add helper function:

```typescript
/**
 * Get action button configuration for an order
 */
export function getActionButtonConfig(order: ClientOrder): {
  showButton: boolean;
  label: string;
  url: string | null;
} | null
```

---

### Phase 5: Client Portal - Action Buttons

**Modify: `src/components/client-portal/ClientOrderCard.tsx`**

Replace or augment the progress bar based on status:

```text
Current behavior (all statuses):
  - Show progress bar

New behavior:
  - If requiresAction && client_action_url exists:
    - Show prominent "Provide Feedback" button (red/action color)
    - Hide or minimize progress bar
  - Else if requiresAction && no URL:
    - Show "Action Required" badge (already exists) + progress bar
  - Else (normal In Progress):
    - Show progress bar (current behavior)
```

**Visual Design:**
```text
┌─────────────────────────────────────────────────────────┐
│ Company Name               [🕒 Action Required]         │
│ Created: Jan 27, 2026                                   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  [🔔 Provide Feedback]                              │ │
│ │       prominent red button                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                     →   │
└─────────────────────────────────────────────────────────┘
```

**Modify: `src/pages/client/ClientOrderDetail.tsx`**

Add a prominent Call to Action card at the top when action is required:

```text
Page Layout (if action required with URL):
┌─────────────────────────────────────────────────┐
│ ⚠️ Action Required                              │
│ ───────────────────────────────────             │
│ Your feedback is needed to proceed.             │
│                                                 │
│ [🔔 Provide Feedback] (large primary button)    │
│                                                 │
│ Opens: [mockups.example.com/project-123]        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📢 Latest Update (if exists)                    │
│ ...                                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Order Details                                   │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

---

## Conditional Display Logic

| Order Status | Has Action URL? | Display on Dashboard Card | Display on Detail Page |
|--------------|-----------------|---------------------------|------------------------|
| In Progress | N/A | Progress bar | Progress bar |
| Awaiting-Client-Feedback | Yes | "Provide Feedback" button | Action Required card with button |
| Awaiting-Client-Feedback | No | Progress bar + Action badge | Progress bar + Action badge |
| Resolved | N/A | Progress bar (100%) | Progress bar (100%) |
| Cancelled | N/A | No progress | Cancelled badge |

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| Database Migration | Create | Add `client_action_url` column and update `client_orders` view |
| `src/types/index.ts` | Modify | Add `client_action_url` to Order interface |
| `src/services/clientOrderService.ts` | Modify | Add `client_action_url` to ClientOrder interface |
| `src/utils/clientStatusTranslator.ts` | Modify | Add `actionButtonLabel` to config and helper function |
| `OrderDetailsSection.tsx` | Modify | Add Client Action URL input field |
| `useOrderEdit.ts` | Modify | Include `client_action_url` in form handling |
| `ClientOrderCard.tsx` | Modify | Show action button when `requiresAction` with URL |
| `ClientOrderDetail.tsx` | Modify | Add prominent Action Required card with button |

---

## Technical Details

### Files to Create/Modify:

**Database:**
1. Migration to add `client_action_url` column
2. Migration to recreate `client_orders` view with new column

**Frontend:**
1. `src/types/index.ts` - Add field to Order interface
2. `src/services/clientOrderService.ts` - Add field to ClientOrder interface
3. `src/utils/clientStatusTranslator.ts` - Add button config and helper
4. `src/components/dashboard/OrderEditForm/OrderDetailsSection.tsx` - Add admin input
5. `src/components/dashboard/OrderEditForm/useOrderEdit.ts` - Include in form handling
6. `src/components/client-portal/ClientOrderCard.tsx` - Conditional action button
7. `src/pages/client/ClientOrderDetail.tsx` - Action Required card with button

### Security Considerations:
- The `client_action_url` is admin-controlled only
- Clients cannot modify this field (view-only through `client_orders` view)
- URL opens in new tab with `rel="noopener noreferrer"` for security
