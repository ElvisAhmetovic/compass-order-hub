

## Fix: UI Becomes Unclickable After Tab Switching

### Root Cause
The Radix UI `TooltipProvider` in `App.tsx` (line 76) uses default settings. Radix tooltips use an internal "grace area" pointer mechanism that can get stuck when the browser fires blur/focus events during tab switches, leaving an invisible overlay that blocks all pointer events.

The memory notes mention this fix was planned (synthetic pointer events + `skipDelayDuration={0}`) but it was never actually implemented in the code.

### Changes

**1. `src/App.tsx`** — Configure TooltipProvider with `skipDelayDuration={0}` and `delayDuration={0}` to prevent the tooltip grace-area from getting stuck:

```tsx
<TooltipProvider skipDelayDuration={0} delayDuration={300}>
```

**2. `src/App.tsx`** — Add a `useEffect` inside the `App` component that listens for `visibilitychange`, `focus`, and `blur` events and dispatches synthetic pointer events to force Radix to release any stuck internal state:

```tsx
useEffect(() => {
  const resetPointerState = () => {
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  };
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      resetPointerState();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', resetPointerState);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', resetPointerState);
  };
}, []);
```

**3. `src/components/ui/dialog.tsx`** — Add `onInteractOutside` handler to `DialogOverlay` and ensure the overlay's pointer-events reset properly. Also add a global `visibilitychange` cleanup that programmatically closes any stuck dialogs by dispatching an Escape keydown event:

The `useEffect` in App.tsx will also dispatch Escape on visibility change to dismiss any stuck dialog/sheet overlays:

```tsx
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    resetPointerState();
    // Dismiss any stuck overlays
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }
};
```

Wait — dismissing with Escape would close legitimate open dialogs too. Better approach: only reset pointer state, don't force-close dialogs.

### Final plan (2 files)

**`src/App.tsx`**:
1. Add `useEffect` with `visibilitychange` + `focus` listeners that dispatch synthetic `pointerdown`/`pointerup` on `document.body`
2. Set `<TooltipProvider skipDelayDuration={0} delayDuration={300}>`

**`src/components/ui/tooltip.tsx`** — No changes needed (provider config is in App.tsx).

This is a minimal, targeted fix for the known Radix tooltip grace-area bug that causes the frozen UI after tab switching.

