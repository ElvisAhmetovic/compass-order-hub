# Test the Stripe link features end to end

I can't sign in to the CRM from here, so I'll test each piece directly, with sample invoice data, in a real browser and against the live email function. No real client emails are sent.

## Tests
1. **PDF button really clicks**
   - In a real browser, build an invoice PDF with a sample Stripe link (download and send versions).
   - Check that the PDF contains a clickable link to that exact address, placed over the purple button.
   - Turn the PDF page into an image and look at it, so the button is visible with the correct text (German and English).
   - Build one without a link: no button and no clickable area.
2. **Invoice preview button**
   - Show the preview with a sample link and confirm the button appears and points to the link.
   - Confirm it's hidden without a link or with an invalid one (http://, "javascript:").
3. **Edit Invoice field**
   - Confirm an invalid link shows the warning and isn't saved.
   - Confirm saving with a valid link sends it to the database, using a test copy of the save step, not a real invoice.
   - Confirm the database save function stores and clears the link: run it inside a test that's undone straight after, so no real invoice changes.
4. **Send to Client email**
   - Confirm the window adds the translated hint line and shows the note, and that the link and button text are passed on.
   - Check the email layout separately: move the button-building step of the email function into a small piece I can test on its own, then check it produces a safe button for https links, and nothing for missing, http or malicious links (including escaping odd characters).
   - Check that the live email function still rejects requests from anyone not signed in.
5. Run all project checks and the build.

Then I'll report exactly what passed, with screenshots of the PDF and preview. Anything I could only check without signing in, I'll say so and give you a 1-minute manual test.

## Technical details
- Playwright script on `localhost:8080`: `await import('/src/utils/invoicePdfGenerator.ts')` → `generateInvoicePDFBase64(...)`. Parse the PDF bytes for `/URI (` and `/Rect`, and render with pdf.js (CDN) to PNG.
- Vitest + Testing Library for `InvoicePreview` and `SendInvoicePDFDialog` (supabase invoke mocked).
- `supabase/functions/send-invoice-pdf/stripeButton.ts` extracted (pure), plus `stripeButton_test.ts` (Deno), then redeploy.
- SQL: `begin; select update_invoice_with_lines(...); select stripe_payment_link ...; rollback;` on an existing invoice.
