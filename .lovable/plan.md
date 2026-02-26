

## Fix: Page Becomes Unresponsive After Switching Tabs

### Root Cause

This is a known Radix UI `TooltipProvider` bug ([radix-ui/primitives#3299](https://github.com/radix-ui/primitives/issues/3299)). When a tooltip is open (or the provider is tracking pointer movement between triggers) and you switch tabs, the `pointerLeave` event never fires. The provider's internal `isPointerInTransitRef` gets stuck in a "transit" state, creating an invisible polygon overlay that intercepts all pointer events across the entire page.

The clicks still register at the DOM level (which is why you see the "User interaction detected" logs), but the Radix transit area swallows them before they reach React components.

### Fix

**`src/App.tsx`** — Add `delayDuration` and `skipDelayDuration={0}` to `TooltipProvider` to reduce the stuck-state window:
```tsx
<TooltipProvider delayDuration={300} skipDelayDuration={0}>
```

**`src/components/layout/GlobalNotifications.tsx`** — Add a `visibilitychange` + `blur` handler that dispatches a synthetic `pointerdown` on the document body when the user returns to the tab, forcing Radix to clear its stuck transit state:
```tsx
useEffect(() => {
  const resetRadixState = () => {
    document.body.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true })
    );
    document.body.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true })
    );
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      resetRadixState();
    }
  };

  const handleBlur = () => resetRadixState();

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', resetRadixState);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', resetRadixState);
  };
}, []);
```

These two changes together ensure that any stuck Radix internal pointer-tracking state gets cleared when the user switches away and returns.

