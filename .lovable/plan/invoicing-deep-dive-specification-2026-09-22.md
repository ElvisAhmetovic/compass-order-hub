# Invoicing Deep-Dive Specification

Produce one document, `INVOICING_SPEC.md`, that describes the entire invoicing system in enough detail for another team to rebuild it from scratch. Documentation only — no code or database changes.

The existing `SYSTEM_SPEC.md` already covers invoice creation, numbering, status rules and reminders at a summary level. This new document goes a layer deeper and adds everything it does not cover: the editing screen, line items, template settings, company info and logo, payment options, language/currency/VAT behaviour, preview, PDF output, and sending.

## What the document will contain

**1. Data model**
Every field of the invoice record, its line items and its payments: what each field means, who writes it, default values, and which fields the database fills automatically versus the ones a person types.

**2. The invoice list screen**
Filters (status, period including the specific-month list, sort), the paid/unpaid summary cards, the outstanding-balance calculation, pagination, and which actions are reachable from the list.

**3. The invoice detail screen, step by step**
- What loads when the page opens and in what order.
- Edit mode: which fields become editable, how header and lines are saved together in one atomic call, and why totals are never calculated in the browser.
- Bill-To overrides: how the recipient block can differ from the stored client, how it is pre-filled, and what happens when the client is swapped afterwards.
- Payments: recording one, partial payments, how status moves to partially paid or paid automatically, outstanding balance display.
- Reminder controls: per-invoice interval, pausing, history.
- Audit entries written from this screen.

**4. Line items**
The row editor, quantity/unit/unit price/discount/VAT per line, how the line total and the invoice totals are computed and by whom, add/remove/reorder behaviour, and what happens when a line insert fails mid-save.

**5. Template settings**
A full walkthrough of the settings panel and where each value is stored (browser storage vs. the company settings record), including the merge order between defaults, saved settings and passed-in settings:
- Logo: upload, size options, default logo, how it reaches the PDF.
- Company information: the fields, how they are saved and reused across invoices and proposals.
- Payment information: the available bank/payment accounts, the "both" option, and how the choice changes the PDF payment block.
- Invoice settings: language, currency, invoice-number prefix, VAT enabled/rate, custom terms.

**6. Language, currency and VAT**
- The translation table: which labels are translated, which languages exist, and what happens for a missing key.
- How the chosen language changes the preview, the PDF and the sending email.
- Currency formatting rules (European number format) and where formatting happens.
- VAT: enabling/disabling, per-line rates, how gross/net/VAT are derived, and the rule that an entered price is treated as the gross total.

**7. Preview and PDF**
- How the on-screen preview is built and where it diverges from the PDF.
- The PDF generator: page structure, header/logo, recipient block, line-item table, totals block, payment details, terms, footer, multi-page behaviour, fonts and colours.
- Download versus preview versus attach-to-email.

**8. Sending to the client**
Both send paths (plain invoice email and PDF attachment), what each one collects, which recipient addresses are used, the sender address rule, what the client receives, what is written back to the invoice and the logs, and failure behaviour.

**9. Lifecycle diagram and state table**
One diagram from creation to settlement, and a table of every status: who or what sets it, what it triggers, and which transitions are blocked.

**10. Rebuild notes**
What is fragile or worth doing differently in a fresh build: settings stored in browser storage rather than the database, the non-transactional line-item insert, duplicated creation paths, and template values that are hard-coded.

## Method

Written from the actual code — the invoice service, detail and list pages, settings components and hooks, translation tables, PDF generator, send dialogs and the sending edge function — plus the live database structure. Anything that cannot be confirmed from code is marked "to confirm" rather than guessed.

## Delivery

`INVOICING_SPEC.md` at the project root, with a copy in Files so it can be downloaded and shared.

## Out of scope

No behaviour changes, no migrations, no redesign.
