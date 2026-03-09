

## Redesign SendInvoicePDFDialog to Match Monthly Invoice Dialog

### What
Replace the current template-selector + translation-service approach in `SendInvoicePDFDialog` with the same simple, proven UI pattern used in `SendMonthlyInvoiceDialog` — language-based subject templates, message templates, and an invoice language dropdown, all powered by the `monthlyInvoiceTemplates.ts` constants.

### Changes

**`src/components/invoices/SendInvoicePDFDialog.tsx`** — Rewrite the form body to match the monthly dialog layout:

1. Remove `TemplateSelector`, `emailTranslationService`, `SUPPORTED_LANGUAGES`, `sanitizeHtml` imports and the Compose/Preview tabs
2. Import `SUBJECT_TEMPLATES`, `MESSAGE_TEMPLATES`, `TEMPLATE_LANGUAGES` from `../monthly/monthlyInvoiceTemplates`
3. Add a `language` state (initialized from `templateSettings.language || "en"`)
4. Replace the template/language grid with these fields (same order as monthly dialog):
   - **Client Name** (read-only input)
   - **Client Email** (editable)
   - **Subject Template** dropdown (Select from `TEMPLATE_LANGUAGES`, sets subject from `SUBJECT_TEMPLATES`)
   - **Subject** (editable input, pre-filled from template)
   - **Invoice Language** dropdown (Select from `LANGUAGES` list of 10 langs, on change syncs subject + message)
   - **Message Template** dropdown (Select from `TEMPLATE_LANGUAGES`, sets message from `MESSAGE_TEMPLATES`)
   - **Message** (editable textarea, pre-filled from template)
5. Keep the existing PDF generation and send logic unchanged
6. Keep the info note about PDF attachment

