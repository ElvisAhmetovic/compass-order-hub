

## Fix: Currency change in Invoice Settings not applying to invoice

### Problem
When the user changes the currency in the "Invoice Settings" tab, it updates `templateSettings.currency` but **not** `formData.currency`. The preview and PDF generation both override `templateSettings.currency` with `formData.currency` (lines 884 and 905), so the change is effectively ignored.

### Root Cause
There's a one-way sync: `formData.currency → templateSettings.currency` (line 116-121), but no reverse sync when the user changes currency via the template settings UI.

### Fix
In `src/pages/InvoiceDetail.tsx`, add a `useEffect` that syncs `templateSettings.currency` back to `formData.currency` whenever template settings change:

```typescript
useEffect(() => {
  if (templateSettings.currency && templateSettings.currency !== formData.currency) {
    setFormData(prev => ({ ...prev, currency: templateSettings.currency }));
  }
}, [templateSettings.currency]);
```

This ensures the currency dropdown in Invoice Settings actually propagates to the invoice record and preview.

### File
- `src/pages/InvoiceDetail.tsx` — add reverse sync effect (~line 122)

