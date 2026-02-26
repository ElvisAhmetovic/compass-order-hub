

## Fix: Order Modal Closing on Tab Switch

### Root Cause

This is **not** an auth/re-render issue. It's a **Radix UI Dialog focus management** issue. When you switch away from the tab and come back, the browser fires focus events. Radix Dialog detects that focus moved outside the dialog content and interprets it as a dismiss action, calling `onOpenChange(false)` — which closes the modal.

### Fix

**`src/components/dashboard/OrderModal.tsx`** — Add `onFocusOutside` and `onPointerDownOutside` handlers to the `DialogContent` to prevent the dialog from closing due to tab-switch focus changes:

```tsx
<DialogContent 
  className="max-w-6xl h-[90vh] flex flex-col p-0"
  onFocusOutside={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
>
```

This prevents the dialog from auto-dismissing when focus leaves due to tab switching, while still allowing the explicit close button (X) and the `onOpenChange` overlay click to work correctly. `onPointerDownOutside` is also prevented to avoid edge cases with overlay clicks triggering an unintended close during tab transitions.

