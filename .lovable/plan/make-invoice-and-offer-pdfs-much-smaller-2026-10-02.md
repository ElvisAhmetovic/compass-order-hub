# Make invoice and offer PDFs much smaller

## Why they are big
Every invoice and offer PDF is a full-page photo of the screen, saved in the heaviest picture format (lossless PNG) at double resolution. A one-page invoice ends up as several megabytes, and multi-page invoices repeat that whole picture on every page.

## What changes
- Save the page picture as a compressed JPEG (high quality, ~0.85) instead of PNG — usually 5–10x smaller with no visible difference for text on white.
- Turn on the PDF's built-in compression.
- Keep resolution sharp enough for printing (scale stays ~2, can drop to 1.5 if still large).
- Applies everywhere the same generators are used: invoice download, Send to Client, monthly package invoices, reminder attachments, and offer/proposal PDFs.

Nothing about the layout, wording or bank details changes.

## Verification
- Generate a sample invoice and offer before/after and compare file sizes.
- Visually check text and logo stay crisp.

## Technical details
- `src/utils/invoicePdfGenerator.ts` (both functions, lines ~63-150): `toDataURL('image/jpeg', 0.85)`, `addImage(..., 'JPEG', ..., undefined, 'FAST')`, `new jsPDF({ orientation:'p', unit:'mm', format:'a4', compress:true })`; add image once via alias for multi-page slices.
- `src/utils/proposal/pdfGenerator.ts` (~553-622): same changes.
- Longer-term option (not in this plan): real text-based PDFs (pdfmake / @react-pdf) would be ~50-100 KB with selectable text.
