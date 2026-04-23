

## Why the Download Button Doesn't Work

In `src/pages/Invoices.tsx` line 662, the download icon's onClick is a placeholder:

```tsx
onClick={() => {/* TODO: Implement PDF download */}}
```

It was never wired up. Clicking it does literally nothing — no error, no download, no console log. That's why nothing happens.

The actual PDF generator (`generateInvoicePDF` in `src/utils/invoicePdfGenerator.ts`) exists and works fine — it's already used successfully on the invoice detail page (`InvoiceDetail.tsx` line 503).

## Fix Plan

Replace the no-op handler on the invoices list row with a real download handler that mirrors what `InvoiceDetail.tsx` does.

### Changes — `src/pages/Invoices.tsx`

1. Add a new `handleDownloadInvoicePDF(invoice)` function that:
   - Fetches the invoice's line items via `InvoiceService.getInvoiceLineItems(invoice.id)`
   - Loads the client via `InvoiceService.getClientById(invoice.client_id)` (so the Bill-To section renders)
   - Loads the user's template settings via the existing `useInvoiceSettings`-style fetch (or a direct supabase query of `company_settings` for the current user — same source the detail page uses)
   - Calls `generateInvoicePDF({ invoice, lineItems, client, templateSettings, formData: { currency: invoice.currency } })`
   - Shows a toast on success / failure (matching the existing pattern)
   - Sets a per-row loading state so the icon shows a spinner while generating (one row at a time)

2. Wire the download button:
   ```tsx
   onClick={() => handleDownloadInvoicePDF(invoice)}
   disabled={downloadingId === invoice.id}
   ```

3. Replace the `Download` icon with a small spinner when `downloadingId === invoice.id`.

### What stays the same
- The PDF generator itself — no changes.
- The invoice detail page download flow — unchanged.
- The list row layout — only the click handler and a tiny loading indicator are added.

### File to modify
1. `src/pages/Invoices.tsx` — add `handleDownloadInvoicePDF`, add `downloadingId` state, wire the icon button (line ~660), import `generateInvoicePDF` from `@/utils/invoicePdfGenerator`.

That's it — one self-contained patch to the invoices list page restores the download functionality.

