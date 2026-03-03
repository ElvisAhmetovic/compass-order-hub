

## Fix: Site becomes unclickable after tab-switching with modal open

### Root cause
The current fix in `App.tsx` toggles `pointer-events: none` for a single animation frame when returning to the tab. This is too brief -- Radix Dialog's internal "dismissal layer" re-evaluates pointer state after the toggle completes, and the overlay ends up in a broken state where it intercepts all clicks but doesn't respond.

### Solution
Two changes:

**1. `src/App.tsx`** -- Extend the pointer-events reset to use a longer delay (100ms via `setTimeout` instead of a single `requestAnimationFrame`), and also handle the `focus` event on `window` (some browsers fire focus but not visibilitychange on tab return):

```ts
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    document.documentElement.style.pointerEvents = 'none';
    setTimeout(() => {
      document.documentElement.style.pointerEvents = '';
    }, 100);
  }
};

const handleWindowFocus = () => {
  document.documentElement.style.pointerEvents = 'none';
  setTimeout(() => {
    document.documentElement.style.pointerEvents = '';
  }, 100);
};
```

Listen to both `visibilitychange` and `window focus`.

**2. `src/components/ui/dialog.tsx`** -- Add `onInteractOutside={(e) => e.preventDefault()}` directly in the `DialogContent` component so every dialog in the app is protected, rather than relying on each usage to add it:

```tsx
<DialogPrimitive.Content
  onInteractOutside={(e) => e.preventDefault()}
  onFocusOutside={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
  ...
```

This makes the fix global -- no individual dialog needs to remember to add these handlers. The existing per-component handlers (like on OrderModal) become redundant but harmless.

### Files to modify
- `src/App.tsx` (lines 76-92) -- longer delay + window focus listener
- `src/components/ui/dialog.tsx` (lines 36-42) -- add interact/focus/pointer outside prevention globally

