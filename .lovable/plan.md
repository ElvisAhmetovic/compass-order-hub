

## Fix: Fit Invoice PDF on a Single Page

### Problem
The PDF renders HTML into a canvas at a fixed 794px width with generous padding and spacing. When content grows (especially with both bank accounts), it exceeds the A4 page height and splits onto two pages.

### Solution
Make the PDF HTML template more compact so everything fits on one A4 page. The multi-page fallback stays as a safety net, but the goal is to prevent overflow in the first place.

### Changes

**`src/utils/invoicePdfGenerator.ts` — Compact the HTML template**

1. **Reduce container padding** from `32px` to `20px` (line 677)
2. **Reduce header margin-bottom** from `40px` to `16px` and padding-bottom from `20px` to `12px` (line 679)
3. **Reduce invoice number font-size** from `36px` to `28px` (line 705)
4. **Reduce company details + invoice info gap** from `40px` to `16px`, margin-bottom from `40px` to `16px` (line 715)
5. **Reduce Bill To margin-bottom** from `40px` to `16px`, padding from `16px` to `10px` (lines 744-746)
6. **Reduce table margin** from `40px 0` to `16px 0`, cell padding from `16px` to `8px` (lines 763-790)
7. **Reduce totals margin** from `32px 0` to `12px 0`, padding from `20px` to `12px` (lines 794-810)
8. **Reduce Notes/Bank Details section margin-top** from `40px` to `16px`, gap from `32px` to `16px`, padding from `16px` to `10px` (lines 814-835)
9. **Reduce font sizes** slightly where oversized (section headers from `16px` to `14px`, balance due from `20px` to `16px`)

These are purely spacing/size reductions in the off-screen HTML template used for PDF generation. The on-screen preview in `InvoicePreview.tsx` stays unchanged — it keeps its current spacious layout.

### Technical detail

The container width stays at 794px (A4 at 96 DPI). The rendered canvas height will shrink by roughly 30-40%, comfortably fitting within the 1123px threshold (A4 height at 96 DPI). The multi-page logic remains as a fallback for invoices with many line items.

