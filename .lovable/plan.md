

# Fix AssignOrdersModal UI Layout Issues

## Problem

The "Link Orders to Client" modal has broken layout where:
- Company names and emails overflow their container
- Status and price badges are cut off on the right side
- Rows have inconsistent heights when content wraps
- Overall modal looks cramped and misaligned

## Root Cause

The flex layout lacks proper width constraints:
- `flex-1` on Label without `min-w-0` causes text to overflow instead of truncate
- No `truncate` class on text elements to handle long content
- Inner flex container doesn't properly distribute space between text and badges
- Badges need flex-shrink protection to prevent clipping

## Solution

Restructure the order row layout with proper constraints:

### 1. Add proper width constraints to flex children

```tsx
<div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent min-w-0">
```

### 2. Fix the inner layout structure

Change from nested flex to a cleaner structure:
- Checkbox (fixed width)
- Content area (flex-1 with min-w-0 to allow truncation)
  - Text section (truncated)
  - Badges section (flex-shrink-0 to prevent clipping)

### 3. Apply text truncation

```tsx
<Label className="flex-1 min-w-0 cursor-pointer">
  <span className="font-medium truncate block">{order.company_name}</span>
  <span className="text-sm text-muted-foreground truncate block">{order.contact_email}</span>
</Label>
```

### 4. Protect badges from shrinking

```tsx
<div className="flex items-center gap-2 flex-shrink-0 ml-2">
  <Badge>...</Badge>
  <Badge>...</Badge>
</div>
```

## Updated Row Structure

```text
┌────────────────────────────────────────────────────────────────────┐
│ ☐ │ Company Name (truncate)          │ [Status] │ [€250.00]  │
│   │ email@example.com (truncate)     │          │            │
└────────────────────────────────────────────────────────────────────┘
     └── min-w-0, flex-1 ──────────────┘ └── flex-shrink-0 ────┘
```

## Code Changes

**File**: `src/components/user-management/AssignOrdersModal.tsx`

Replace the order row mapping (lines 171-204) with:

```tsx
{orders.map(order => (
  <div 
    key={order.id} 
    className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent"
  >
    <Checkbox 
      id={`order-${order.id}`}
      checked={selectedOrders.includes(order.id)}
      onCheckedChange={() => toggleOrderSelection(order.id)}
      className="mt-0.5 flex-shrink-0"
    />
    <Label 
      htmlFor={`order-${order.id}`}
      className="flex-1 min-w-0 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{order.company_name}</p>
          {order.contact_email && (
            <p className="text-xs text-muted-foreground truncate">{order.contact_email}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge className={`${getStatusColor(order.status)} text-xs px-2 py-0.5`}>
            {order.status}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5 whitespace-nowrap">
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: order.currency || 'EUR' 
            }).format(order.price || 0)}
          </Badge>
        </div>
      </div>
    </Label>
  </div>
))}
```

## Key Fixes Summary

| Issue | Fix |
|-------|-----|
| Text overflow | Add `min-w-0` and `truncate` classes |
| Badge clipping | Add `flex-shrink-0` to badge container |
| Misaligned rows | Use `items-start` instead of `items-center` |
| Cramped spacing | Increase gap from `space-x-2` to `gap-3` |
| Long emails breaking layout | Add `truncate` to email text |
| Badge visibility | Add `whitespace-nowrap` to price badge |

## Expected Result

After fixing:
- Company names truncate with ellipsis when too long
- Emails truncate properly below company name
- Status and price badges always visible and aligned
- Consistent row heights
- Clean, professional appearance

