

# Status Translator Implementation Plan

## Overview
Create a centralized "Status Translator" utility that maps internal technical status values (e.g., 'Dev-Sprint', 'QA', 'Briefing') to client-friendly display labels with optional emojis and visual styling. This translation applies **only** to client-facing components while the admin dashboard continues to display raw internal statuses.

---

## Current State Analysis

### Existing Status Handling:
1. **Admin Dashboard (`OrderRow.tsx`)**: Uses raw status values like "Created", "In Progress", "Invoice Sent", etc. with color-coded badges
2. **Client Components**: Currently use boolean flags (`status_created`, `status_in_progress`, etc.) to derive progress labels
3. **Order Types**: `OrderStatus` type in `types/index.ts` defines available statuses
4. **No Translation Layer**: Currently no mechanism to map internal → client-friendly terminology

### Files That Display Status to Clients:
- `src/components/client-portal/ClientOrderCard.tsx` - Order cards with progress bars
- `src/pages/client/ClientOrders.tsx` - Order list with status badges  
- `src/pages/client/ClientOrderDetail.tsx` - Order detail with progress steps

---

## Implementation Plan

### Step 1: Create Status Translation Utility

**New File: `src/utils/clientStatusTranslator.ts`**

This file will contain:

1. **Status Translation Map**: Object mapping internal statuses to client-friendly versions

```typescript
interface ClientStatusConfig {
  label: string;           // Client-friendly label
  emoji: string;           // Optional emoji prefix
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'action';
  badgeClassName?: string; // Custom styling
  progress: number;        // Progress bar percentage
  requiresAction?: boolean; // Flag for "Action Required" states
}

const STATUS_TRANSLATION_MAP: Record<string, ClientStatusConfig> = {
  // Internal Status -> Client Display
  "Created": { 
    label: "Order Received", 
    emoji: "📋", 
    badgeVariant: "secondary",
    progress: 10 
  },
  "In Progress": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 40 
  },
  "Invoice Sent": { 
    label: "Invoice Sent", 
    emoji: "📄", 
    badgeVariant: "outline",
    progress: 60 
  },
  "Invoice Paid": { 
    label: "Payment Received", 
    emoji: "✅", 
    badgeVariant: "default",
    progress: 80 
  },
  "Resolved": { 
    label: "Completed", 
    emoji: "🎉", 
    badgeVariant: "default",
    badgeClassName: "bg-green-500 hover:bg-green-600",
    progress: 100 
  },
  "Cancelled": { 
    label: "Cancelled", 
    emoji: "❌", 
    badgeVariant: "destructive",
    progress: 0 
  },
  // Extended technical statuses (examples from user request)
  "Dev-Backend": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 35 
  },
  "Dev-Sprint": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 45 
  },
  "QA": { 
    label: "Quality Review", 
    emoji: "🔍", 
    badgeVariant: "secondary",
    progress: 70 
  },
  "Briefing": { 
    label: "Getting Started", 
    emoji: "📝", 
    badgeVariant: "secondary",
    progress: 15 
  },
  "Awaiting-Client-Feedback": { 
    label: "Action Required", 
    emoji: "🕒", 
    badgeVariant: "action",
    badgeClassName: "bg-red-500 hover:bg-red-600 text-white",
    progress: 50,
    requiresAction: true 
  },
  "Review": { 
    label: "Under Review", 
    emoji: "👀", 
    badgeVariant: "secondary",
    progress: 55 
  },
};
```

2. **Helper Functions**:

```typescript
// Get translated status from internal status string
export function getClientStatus(internalStatus: string): ClientStatusConfig

// Get translated status from order with boolean flags
export function getClientStatusFromOrder(order: ClientOrder): ClientStatusConfig

// Get just the display label with emoji
export function getClientStatusLabel(internalStatus: string, includeEmoji?: boolean): string

// Check if status requires client action
export function statusRequiresAction(internalStatus: string): boolean
```

---

### Step 2: Update ClientOrderCard Component

**Modify: `src/components/client-portal/ClientOrderCard.tsx`**

Changes:
1. Import the new `getClientStatusFromOrder` function
2. Replace hardcoded `getProgressFromStatus` with the translator
3. Update badge display to use translated labels with emojis
4. Add special styling for "Action Required" states

```text
Before:
  const getProgressFromStatus = (order) => {
    if (order.status_cancelled) return { progress: 0, label: "Cancelled" };
    if (order.status_resolved) return { progress: 100, label: "Completed" };
    ...
  }

After:
  import { getClientStatusFromOrder } from "@/utils/clientStatusTranslator";
  
  const ClientOrderCard = ({ order }) => {
    const statusConfig = getClientStatusFromOrder(order);
    const displayLabel = `${statusConfig.emoji} ${statusConfig.label}`;
    ...
  }
```

---

### Step 3: Update ClientOrders Page

**Modify: `src/pages/client/ClientOrders.tsx`**

Changes:
1. Import translator functions
2. Replace `getStatusBadge` with translated version
3. Apply proper badge styling based on `badgeClassName`

```text
Before:
  if (order.status_resolved) return <Badge>Resolved</Badge>;
  if (order.status_invoice_paid) return <Badge>Paid</Badge>;
  ...

After:
  import { getClientStatusFromOrder, getClientStatusBadge } from "@/utils/clientStatusTranslator";
  
  const getStatusBadge = (order: ClientOrder) => {
    const config = getClientStatusFromOrder(order);
    return (
      <Badge 
        variant={config.badgeVariant}
        className={config.badgeClassName}
      >
        {config.emoji} {config.label}
      </Badge>
    );
  };
```

---

### Step 4: Update ClientOrderDetail Page

**Modify: `src/pages/client/ClientOrderDetail.tsx`**

Changes:
1. Import translator functions
2. Replace hardcoded `statusSteps` with translated labels
3. Update progress bar calculation to use translator
4. Keep the step-by-step timeline but with client-friendly labels

```text
Before:
  const statusSteps = [
    { key: "created", label: "Created", active: order.status_created, icon: Clock },
    { key: "in_progress", label: "In Progress", ... },
    ...
  ];

After:
  import { translateStatusStep, getClientStatusFromOrder } from "@/utils/clientStatusTranslator";
  
  const statusSteps = [
    translateStatusStep("created", order.status_created),
    translateStatusStep("in_progress", order.status_in_progress),
    ...
  ];
```

---

### Step 5: Add Badge Variant for "Action Required"

**Modify: `src/components/ui/badge.tsx`**

Add a new variant for action-required states:

```typescript
variants: {
  variant: {
    default: "...",
    secondary: "...",
    destructive: "...",
    outline: "...",
    action: "border-transparent bg-red-500 text-white hover:bg-red-600 animate-pulse", // NEW
  },
},
```

This creates a visually distinct, attention-grabbing badge for states requiring client action.

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `clientStatusTranslator.ts` | Create | New utility with translation map and helper functions |
| `ClientOrderCard.tsx` | Modify | Use translator for progress and labels |
| `ClientOrders.tsx` | Modify | Use translator for status badges |
| `ClientOrderDetail.tsx` | Modify | Use translator for progress steps |
| `badge.tsx` | Modify | Add "action" variant for attention states |

---

## Technical Details

### Files to Create:
1. `src/utils/clientStatusTranslator.ts` - Status translation utility

### Files to Modify:
1. `src/components/client-portal/ClientOrderCard.tsx` - Order card component
2. `src/pages/client/ClientOrders.tsx` - Orders list page
3. `src/pages/client/ClientOrderDetail.tsx` - Order detail page
4. `src/components/ui/badge.tsx` - Add action variant

### No Changes Required:
- **Admin Dashboard**: All admin components (`OrderRow.tsx`, `OrderModal.tsx`, etc.) continue to use raw internal statuses unchanged
- **Database**: No schema changes needed
- **Services**: No API changes needed

---

## Example Translation Scenarios

| Internal Status | Client Sees | Badge Style |
|-----------------|-------------|-------------|
| `Created` | 📋 Order Received | Gray/Secondary |
| `In Progress` | 🏗️ In Progress | Blue/Default |
| `Dev-Backend` | 🏗️ In Progress | Blue/Default |
| `Dev-Sprint` | 🏗️ In Progress | Blue/Default |
| `QA` | 🔍 Quality Review | Gray/Secondary |
| `Briefing` | 📝 Getting Started | Gray/Secondary |
| `Awaiting-Client-Feedback` | 🕒 Action Required | Red/Pulsing |
| `Invoice Sent` | 📄 Invoice Sent | Outline |
| `Invoice Paid` | ✅ Payment Received | Blue/Default |
| `Resolved` | 🎉 Completed | Green |
| `Cancelled` | ❌ Cancelled | Red/Destructive |

---

## Extensibility

The translation map is designed to be easily extended:

1. **Add new internal statuses**: Simply add a new entry to `STATUS_TRANSLATION_MAP`
2. **Change client labels**: Update the `label` field in the map
3. **Adjust progress weights**: Modify the `progress` value
4. **Add action states**: Set `requiresAction: true` for any status needing client attention
5. **Custom styling**: Use `badgeClassName` for any status-specific colors

The fallback behavior ensures any unmapped status displays gracefully as "Status: [raw value]" with a neutral badge.

