

## Fix Modal Breaking on Tab Switch

### Root Cause

The `resetPointerState` function in `src/App.tsx` (lines 76-78) dispatches synthetic `pointerdown` and `pointerup` events on `document.body` every time the browser tab regains focus. Even though dialogs have `onPointerDownOutside={(e) => e.preventDefault()}`, Radix Dialog's internal pointer tracking state gets corrupted by these synthetic events, making the UI unresponsive or causing modals to close/break.

### Fix

**`src/App.tsx`** -- Replace the synthetic pointer event approach with a CSS-based fix that addresses the same tooltip/pointer issue without interfering with Radix Dialog internals:

1. Remove the `resetPointerState` function and its `visibilitychange`/`focus` event listeners (lines 75-93)
2. Instead, on visibility change, briefly toggle a CSS class on `document.documentElement` that sets `pointer-events: none` then immediately removes it. This forces the browser to re-evaluate pointer state without dispatching events that Radix intercepts:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Force browser to re-evaluate pointer state without
      // synthetic events that break Radix Dialog internals
      document.documentElement.style.pointerEvents = 'none';
      requestAnimationFrame(() => {
        document.documentElement.style.pointerEvents = '';
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
```

**`src/pages/Proposals.tsx`** -- Remove the `window.addEventListener('focus', handleFocus)` listener (line 79) that refetches all proposals on every tab switch, as it causes unnecessary re-renders. Keep only the `popstate` listener.

### Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Replace synthetic pointer events with CSS pointer-events toggle |
| `src/pages/Proposals.tsx` | Remove focus-based refetch |

