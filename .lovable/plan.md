

## Diagnosis: PDF Content Gets Clipped to One Page

After reviewing the code, the logic for selecting "both" accounts is identical in `InvoicePreview.tsx` (line 114) and `invoicePdfGenerator.ts` (line 378) — both correctly check `templateSettings.selectedPaymentAccount === "both"` and render both account blocks.

The issue is that **the PDF generator only creates a single A4 page** (lines 68-73 of `invoicePdfGenerator.ts`). When you select "both" accounts, the bank details section at the bottom of the invoice grows taller. Since the content is rendered as one image onto a single 297mm-tall page, anything that extends beyond that height gets clipped — and the bank details section is at the very bottom, so the second account block (and possibly even part of the first) gets cut off.

The same function (`generateInvoicePDFBase64`, lines 114-124) used for "Send to Client" has the same single-page limitation.

### Changes

**`src/utils/invoicePdfGenerator.ts`** — Add multi-page support to both `generateInvoicePDF` (download) and `generateInvoicePDFBase64` (send to client):

Replace the single `addImage` call with a loop that:
1. Calculates total content height vs A4 page height (297mm)
2. If content fits on one page, renders as before
3. If content overflows, slices the canvas into page-sized chunks and calls `pdf.addPage()` for each additional page

```typescript
const pageHeight = 297; // A4 height in mm
const imgWidth = 210;
const imgHeight = (canvas.height * imgWidth) / canvas.width;

if (imgHeight <= pageHeight) {
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
} else {
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
}
```

This fix applies to both the download and send-to-client flows, ensuring invoices with "both" accounts (or many line items) render completely across multiple pages.

