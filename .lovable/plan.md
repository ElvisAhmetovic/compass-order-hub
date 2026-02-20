

## Fix: Autofill Dropdown Unclickable Inside Create Order Modal

### Root Cause

The `OrderSearchDropdown` uses a Radix **Popover** which renders its content via a **Portal** (outside the Dialog DOM). The Radix **Dialog** (Create Order Modal) has a built-in **focus trap** that blocks all pointer events and keyboard interaction with elements outside its DOM subtree. This is why you can see the dropdown but can't click or scroll it.

This works in the Lovable editor because the preview iframe handles focus differently, but on a real deployed site the focus trap is fully active.

### Solution

Replace the Radix Popover with a simple absolutely-positioned `div` that stays **inside** the Dialog's DOM tree, bypassing the focus trap entirely. This is a common pattern for dropdowns nested inside modals.

### Changes

**File: `src/components/dashboard/OrderSearchDropdown.tsx`**

Remove the Radix Popover/PopoverContent/PopoverTrigger imports and replace with a plain div-based dropdown:

- The trigger button toggles a boolean state
- When open, render an absolutely-positioned `div` directly below the button (using `relative` parent + `absolute` child)
- The div contains the search input and scrollable order list (same UI as before)
- Click-outside handling via a simple `useRef` + `mousedown` listener
- This keeps the dropdown inside the Dialog DOM, so the focus trap allows interaction

```
Before (broken):
  Dialog (portal, focus trap)
    -> Popover
      -> PopoverContent (PORTAL - renders OUTSIDE Dialog)
         -> Can't interact! Focus trap blocks it.

After (works):
  Dialog (portal, focus trap)
    -> div (relative)
      -> Button (trigger)
      -> div (absolute, inside Dialog DOM)
         -> Fully interactive! Inside the focus trap.
```

No other files need to change. The component's props and behavior remain identical.

