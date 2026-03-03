

## Auto-sync Invoice Language dropdown with Subject & Message templates

### What this does
When the user selects a language from the "Invoice Language" dropdown, the Subject and Message fields automatically populate with the matching language template — so the user doesn't have to separately pick the same language from the Subject Template and Message Template dropdowns.

### Changes to `src/components/monthly/SendMonthlyInvoiceDialog.tsx`

1. **Modify the Invoice Language `onValueChange` handler** to also call `setSubject(SUBJECT_TEMPLATES[lang])` and `setMessage(MESSAGE_TEMPLATES[lang])` alongside `setLanguage(lang)`.

2. **Also auto-fill on dialog open** — the existing `useEffect` that runs on `open` already sets `language`. Add `setSubject(SUBJECT_TEMPLATES[detectedLanguage])` and `setMessage(MESSAGE_TEMPLATES[detectedLanguage])` there too, so the initial language pre-fills all three fields.

One file, ~5 lines changed.

