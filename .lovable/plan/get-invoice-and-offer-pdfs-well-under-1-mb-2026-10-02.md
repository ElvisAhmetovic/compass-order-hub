# Get invoice and offer PDFs well under 1 MB

## First: check which version made the 10,6 MB file
The compression change from the last step only exists in the preview until the app is published. A 10,6 MB file almost certainly came from the live site, or was made before the change. Making a PDF in the preview right now should already be far smaller.

## Further shrinking (this plan)
- Lower the picture resolution slightly (from 2x to 1.5x screen size). Still sharp when printed.
- Compress the picture a little more (quality 0.85 to 0.75).
- Expected result: about 200–500 KB per page instead of megabytes.
- Applies to downloads, Send to Client, monthly invoices, reminder attachments and offers.
- I will generate a sample PDF in the sandbox, measure its size and check that the text is still sharp before handing over.

After that, please publish so the live site gets the smaller files.

## Optional later step (not in this plan)
Rebuild the PDFs as real text instead of a picture of the page. That gets files to about 50–100 KB, lets people select and copy the text, and gives sharper printing. It is a bigger job, because the layout is rebuilt in a new PDF tool.

## Technical details
- `src/utils/invoicePdfGenerator.ts`: html2canvas `scale: 1.5`; `toDataURL('image/jpeg', 0.75)` in both functions.
- `src/utils/proposal/pdfGenerator.ts`: default `scale` 2 to 1.5 in generateMultiPagePDF and its callers; JPEG quality 0.75.
- QA: render a sample invoice HTML through the same html2canvas + jsPDF pipeline in headless Chromium, record byte size, rasterize with pdftoppm and inspect.
