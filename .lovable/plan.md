

## Fix: Upsell Modal Closing on Tab Switch

Same Radix Dialog focus-trap issue as the OrderModal fix.

### Change

**`src/pages/Upsell.tsx`** — Add `onFocusOutside` and `onPointerDownOutside` handlers to the `DialogContent`:

```tsx
<DialogContent
  onFocusOutside={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
>
```

Single-line fix, same pattern already applied to `OrderModal.tsx`.

