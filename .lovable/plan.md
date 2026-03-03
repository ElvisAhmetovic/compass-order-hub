

## Auto-Save Invoice on Navigation

### Current behavior
- The Save button exists and calls `handleSave()` which works for both new and existing invoices.
- When navigating away (clicking "Back to Invoices" or using browser navigation), unsaved changes are lost.

### Changes to `src/pages/InvoiceDetail.tsx`

1. **Auto-save on "Back to Invoices" click**: Modify the back button's `onClick` to call `handleSave()` first (for existing invoices with changes), then navigate. For new invoices, prompt or just navigate since they need explicit creation.

2. **Auto-save on route change / component unmount**: Add a `useEffect` cleanup that triggers save for existing invoices when the component unmounts (user navigates elsewhere). Use a ref to track the latest form data and line items so the cleanup has access to current values.

3. **Prevent accidental browser tab close**: Add a `beforeunload` event listener that warns about unsaved changes.

4. **Track dirty state**: Add a `isDirty` ref that gets set to `true` whenever `formData`, `lineItems`, or `billToOverride` change after initial load, so we only auto-save when there are actual changes.

### Technical approach

```ts
const isDirty = useRef(false);
const formDataRef = useRef(formData);
const lineItemsRef = useRef(lineItems);

// Keep refs in sync
useEffect(() => { formDataRef.current = formData; }, [formData]);
useEffect(() => { lineItemsRef.current = lineItems; }, [lineItems]);

// Mark dirty on changes (skip initial load)
useEffect(() => { if (!loading) isDirty.current = true; }, [formData, lineItems]);

// Auto-save on unmount for existing invoices
useEffect(() => {
  return () => {
    if (!isNewInvoice && id && isDirty.current) {
      // Fire-and-forget save using refs
      const data = formDataRef.current;
      InvoiceService.updateInvoice(id, { ... });
      // Save line items too
    }
  };
}, [id, isNewInvoice]);

// Warn on browser close
useEffect(() => {
  const handler = (e) => { if (isDirty.current) { e.preventDefault(); } };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, []);
```

The "Back to Invoices" button will be changed to save first then navigate:
```ts
onClick={async () => {
  if (!isNewInvoice && isDirty.current) {
    await handleSave();
  }
  navigate('/invoices');
}}
```

After a successful save, `isDirty` resets to `false` so the unmount cleanup won't double-save.

