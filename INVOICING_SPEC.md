# Invoicing System — Deep Specification

**Scope:** everything about invoices in this CRM: data model, list screen, detail/edit screen, line items, template settings (logo, company info, payment accounts, invoice settings), language/currency/VAT, preview, PDF, sending to the client, lifecycle, and rebuild notes.

This document is written from the live code and the live database. It complements `SYSTEM_SPEC.md` (which covers the whole CRM at a higher level). Where behaviour could not be confirmed, it is marked **(to confirm)**.

Primary sources:

| Area | File |
|---|---|
| Data access + creation | `src/services/invoiceService.ts` |
| Detail / edit screen | `src/pages/InvoiceDetail.tsx` |
| List screen | `src/pages/Invoices.tsx` |
| Line item row | `src/components/invoices/LineItemRow.tsx` |
| Template settings | `src/components/invoices/InvoiceTemplateSettings.tsx`, `components/*`, `hooks/useInvoiceSettings.ts` |
| Constants (accounts, languages, currencies, terms) | `src/components/invoices/constants.ts` |
| Translations | `src/components/invoices/invoiceTranslations.ts` |
| Preview | `src/components/invoices/InvoicePreview.tsx` |
| PDF | `src/utils/invoicePdfGenerator.ts` |
| Sending | `SendInvoiceDialog.tsx`, `SendInvoicePDFDialog.tsx`, edge function `send-invoice-pdf` |
| Balance helpers | `src/utils/invoiceBalance.ts` |
| Audit | `src/services/invoiceAuditService.ts` |
| Company identity | `src/utils/proposal/companyInfo.ts`, `src/services/companySettingsService.ts` |

---

## 1. Data model

### 1.1 `invoices`

| Column | Type | Default | Written by |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | DB |
| `invoice_number` | text, not null | — | `generate_invoice_number()` RPC, or an explicit `INV-YYYY-NNN` from the edit screen |
| `client_id` | uuid, not null | — | user (client picker) |
| `issue_date` | timestamptz, not null | `now()` | user |
| `due_date` | timestamptz, not null | — | user; defaults to today + 30 days on new invoices |
| `net_amount` | numeric, not null | 0 | **DB only** (`recalculate_invoice_totals`) |
| `vat_amount` | numeric, not null | 0 | **DB only** |
| `total_amount` | numeric, not null | 0 | **DB only** |
| `currency` | text, not null | `'EUR'` | user |
| `status` | text, not null | `'draft'` | user actions, triggers, RPCs |
| `payment_terms` | text | `'Net 30'` | user |
| `notes` | text | null | user — client-visible |
| `internal_notes` | text | null | user — never rendered in preview/PDF/email |
| `user_id` | uuid, not null | — | the authenticated creator |
| `proposal_id` | uuid | null | proposal→invoice conversion |
| `order_id` | uuid | null | set at insert time when created from an order |
| `reminder_count` | int, not null | 0 | reminder cron |
| `last_reminder_sent_at` | timestamptz | null | reminder cron |
| `next_reminder_at` | timestamptz | null | send actions, cron, payment trigger, order cancel |
| `reminder_interval_hours` | int | **168** (7 days) | per-invoice override |
| `reminders_paused` | bool, not null | false | user |
| `cc_emails` | text[] , not null | `{}` | reminder recipients |
| `bill_to_name/email/address/city/zip_code/country` | text | null | user — PDF recipient override |
| `auto_cancelled_by_order` | bool, not null | false | order-cancel automation, so un-cancelling can restore only what it cancelled |
| `created_at` / `updated_at` | timestamptz | `now()` | DB |

Structural rule: **at most one non-cancelled invoice per order**, enforced by the partial unique index `uniq_invoices_order_id_active`.

### 1.2 `invoice_line_items`

`id`, `invoice_id` (not null), `item_description` (not null), `quantity` (default 1), `unit` (default `'pcs'`), `unit_price` (default 0), `vat_rate` (default 0, stored as a **fraction** — 0.19 = 19 %), `discount_rate` (default 0, fraction), `line_total` (default 0, **DB-computed**), timestamps.

`line_total` is always written by the trigger `update_line_item_total` →
`calculate_line_total(qty, unit_price, discount_rate, vat_rate) = ROUND(qty * unit_price * (1 - discount) * (1 + vat), 2)`.
So the stored line total is **gross** (VAT included).

### 1.3 `payments`

`id`, `invoice_id`, `amount`, `payment_date` (default `now()`), `payment_method` (default `'bank_transfer'`; also `credit_card`, `cash`, `other`), `transaction_id`, `notes`, `created_at`.

### 1.4 `invoice_sequences`

`year`, `prefix` (default `'INV'`), `last_sequence`, timestamps. Unique on `(year, prefix)`.

### 1.5 Database functions and triggers

| Object | Behaviour |
|---|---|
| `update_line_item_total` (BEFORE INSERT/UPDATE on lines) | recomputes `line_total` |
| `trigger_recalculate_invoice_totals` (AFTER INSERT/UPDATE/DELETE on lines) | calls `recalculate_invoice_totals` |
| `recalculate_invoice_totals(invoice_id)` | `net = Σ qty·price·(1-disc)`, `vat = Σ net_line·vat_rate`, `total = Σ line_total` |
| `update_invoice_status_on_payment` (AFTER INSERT on payments) | paid ≥ total → `paid`; 0 < paid < total → `partially_paid`; clears `next_reminder_at` in both cases |
| `generate_invoice_number(prefix, year, sequence)` | see §3.2 |
| `update_invoice_with_lines(invoice_id, header jsonb, lines jsonb)` | atomic header + lines upsert + delete-missing + recalc (see §4.3) |
| `sync_invoice_status(invoice_id, status, next_reminder_at)` | security-definer status setter used by order automations; validates the status value |

---

## 2. The invoice list screen (`/invoices`)

Loads **all** invoices through `InvoiceService.getInvoices()`, which pages the Supabase query in blocks of 1000 (the default 1000-row cap would otherwise silently truncate), embeds `client:clients(*)` and `payments(amount)`, then attaches linked order context (`company_name`, `contact_email`, price, assignee) in one extra query keyed by `order_id`.

Controls:

- **Search** — debounced free text.
- **Status** — all / draft / sent / paid / partially paid / overdue / cancelled / refunded.
- **Period** — all time, today, this week, this month, last month, this year, a **Specific month** list of the last 24 months (`month:YYYY-MM`), or **Custom** from/to.
- **Sort** — separate control; Period decides *which* invoices are shown, Sort decides their *order*.
- **Active range chip** — e.g. "May 2026 ×", removable.
- **Empty state** — "No invoices match these filters" + Clear filters.
- **Pagination** — 25 rows per page (`PAGE_SIZE = 25`) with a page counter.
- Clicking the Paid summary card with a month selected filters the list to that month's paid invoices, with a live count and total.

Outstanding column uses `src/utils/invoiceBalance.ts`:

```
paid        = Σ payments.amount
outstanding = total_amount - paid, floored at 0
              and forced to 0 when status ∈ {paid, cancelled, refunded}
partially   = paid > 0 && outstanding > 0
```

---

## 3. Creating an invoice

### 3.1 The three entry points

| Path | Trigger | `order_id` |
|---|---|---|
| A — manual | "New invoice" → `/invoices/new` | null |
| B / C — from an order | toggling **Invoice Sent** or **Invoice Paid** with no invoice yet (`orderService.ts`) | set at insert time |
| D — proposal | `InvoiceService.convertProposalToInvoice` | null, `proposal_id` set |
| E — monthly contract | `generate-monthly-installments` edge function | set per installment |

### 3.2 Numbering

`generate_invoice_number(prefix='INV', year?, sequence?)`:

1. Scans existing `invoice_number` values matching `PREFIX-YEAR-N` and takes the highest N.
2. If an explicit `sequence` was passed, it is used as-is and `invoice_sequences.last_sequence` is raised to `GREATEST(current, sequence)` — a manual low number can never rewind the counter.
3. Otherwise it loops: bump the sequence row, format the candidate, and exit only when no invoice already holds that number.
4. Format: `INV-YYYY-NNN`, zero-padded to 3 digits below 1000, unpadded above.

### 3.3 `InvoiceService.createInvoice`

1. Requires an authenticated user.
2. Up to **5 attempts** (1 if a custom sequence was supplied).
3. Generates a number, inserts the invoice row (with `order_id` when supplied).
4. **Order conflict** (`23505` on `order_id` / `uniq_invoices_order_id_active`): does not fail — re-reads the existing non-cancelled invoice for that order and returns it; audit `phase: existing_returned_on_order_conflict`.
5. **Number conflict** (`23505` on `invoice_number`): audit `phase: retry_conflict`, retry. After the last attempt: user-facing "This invoice number already exists. Please refresh and try again", audit `phase: final_conflict`.
6. Line items are inserted **one at a time**. If any fails, the freshly created invoice row is deleted (manual compensation — not a transaction) and the error is surfaced.
7. Every outcome is written to `invoice_audit_logs` through `InvoiceAuditService`, which classifies errors into `conflict_409`, `permission_denied`, `validation_error`, `unknown_error`, auto-fills actor id/email/name/role and the user agent, and **never throws** (a failed audit write is only a console warning).

---

## 4. The invoice detail screen (`/invoices/:id`, `/invoices/new`)

Three tabs: **Edit Invoice**, **Template Settings**, **Preview**.

### 4.1 Load order

1. `getClients()` — the client picker list.
2. New invoice → `getNextSequenceNumber(currentYear)` prefills year + next number.
3. Existing invoice → `getInvoice(id)` (with client + payments), parse `INV-YYYY-NNN` into the year/number boxes, `getLineItems(id)`, then populate the form.
4. Bill-To is hydrated **from the invoice first**, falling back to the linked client per field.
5. `templateSettings.currency` is set from the invoice.
6. `initialLoadDone` flips 100 ms later so dirty-tracking ignores the load.
7. If there are no line items after load, one empty row is added automatically.

### 4.2 Editable header fields

Invoice year, invoice number, client (searchable combobox by name+email), Bill-To override block (6 fields, shown once a client is selected), currency, issue date, due date, payment terms, public notes, internal notes.

Two-way currency binding: changing the form currency updates `templateSettings.currency`, and changing it in Template Settings writes back to the form.

**Bill-To rules**
- Persisted on the invoice as `bill_to_*`; empty strings are stored as `NULL`.
- Overrides the linked client everywhere the recipient block is rendered (preview, PDF) via `billToClient = { ...selectedClient, ...billToOverride }`.
- Changing the client afterwards **refills all six fields** from the newly chosen client.
- `SendInvoicePDFDialog` prefers `bill_to_email` over the client's email.

**Dirty tracking / auto-save**
- Any change to form data, line items or Bill-To marks the page dirty.
- Leaving via "Back to Invoices" saves first.
- On unmount, a dirty existing invoice gets a header-only auto-save (no line items) via `updateInvoice`.
- `beforeunload` warns on a dirty tab.

### 4.3 Saving

**New invoice** → `createInvoice(formData + line items, year, sequence)`, then navigate to `/invoices`.

**Existing invoice** → one atomic RPC:

```
update_invoice_with_lines(p_invoice_id, p_header jsonb, p_lines jsonb)
```

- Header update is **whitelisted** (client, dates, currency, terms, notes, internal notes, invoice number, the six bill_to fields). Unknown keys are ignored.
- Lines with a real UUID are updated; lines with no id or a `temp-` id are inserted; **any line not in the payload is deleted**.
- `recalculate_invoice_totals` runs at the end, so `net_amount`, `vat_amount`, `total_amount` are always DB-derived. The browser never writes totals.
- If the RPC errors, the page falls back to the legacy path (header update, delete removed lines, insert/update the rest) so a bad RPC can never block a save.
- If a custom year+number was given, `invoice_sequences` is raised afterwards.
- Line items are re-read so `temp-` ids are replaced by real ones.

### 4.4 Payments and balance

- `getPayments`, `addPayment`, `deletePayment` on the `payments` table.
- Inserting a payment fires `update_invoice_status_on_payment` → status becomes `paid` or `partially_paid` and `next_reminder_at` is cleared.
- The Summary card shows Net, VAT, Total, and — when payments exist — **Paid** (green) and **Outstanding** (red) from `invoiceBalance.ts`.
- `PaymentTracker.tsx` manages payment *links* per gateway. These are **not real payment processing** — no live Stripe/PayPal integration is wired up; links are records only.

### 4.5 Reminder controls

- `reminder_interval_hours` per invoice, default **168 h (7 days)**; helpers in `src/utils/reminderInterval.ts`.
- `reminders_paused` switches automatic chasing off for a single invoice; `clients.auto_reminders_enabled` switches it off for a whole client.
- `next_reminder_at` is armed when the invoice is sent (only if not already set) and cleared on payment, on order cancellation, and by the cron when it detects the invoice is already settled.
- The cron (`send-invoice-payment-reminders`) escalates wording at reminder 2 and 3+, self-heals invoices whose order is already paid or cancelled, and only runs inside weekday business hours (Europe/Sarajevo, 09:00–17:00).

### 4.6 Audit

Creation, conflicts and order-driven cancel/restore write `invoice_audit_logs` rows (actor, order context, client, invoice number, error code/message, attempt number, `metadata.phase`). Visible to admins at `/admin/invoice-audit` with CSV export.

---

## 5. Line items

`LineItemRow.tsx` renders one row: Description (with inventory autocomplete), Qty, Unit, Price, VAT %, Discount %, Total, delete.

- VAT and discount are shown as **percentages** but stored as fractions (`value / 100`).
- Selecting an inventory item fills description, price (European format tolerant parser) and unit.
- Rows are added with `Add Item` and removed with the trash icon. There is **no reordering** — lines are ordered by `created_at`.

### 5.1 The gross-anchored calculation (important)

`updateLineItem` in `InvoiceDetail.tsx` has three branches:

1. **Editing Total directly** — the typed value is treated as the **gross** line total, and `unit_price` is reverse-derived:
   `unit_price = round(total / qty / (1 - discount) / (1 + vat), 2)`.
2. **Editing VAT, Qty or Discount while a total already exists** — the total stays anchored and `unit_price` is re-derived from it. This is what makes "enter the price the client pays, then switch VAT on" behave correctly: the customer-facing total does not move.
3. **Anything else** — forward calculation: `total = round(qty · price · (1 - discount) · (1 + vat), 2)`.

The database recomputes the same forward formula on save, so browser and DB agree.

### 5.2 Failure behaviour

- On **create**, a failing line insert deletes the just-created invoice and reports "Failed to add line item N".
- On **update**, the RPC is a single transaction — a failing line rolls the whole save back; only then does the legacy non-atomic fallback run.

---

## 6. Template settings

Tab 2 of the detail screen. `InvoiceTemplateSettings.tsx` composes four panels and pushes the merged object up via `onSettingsChange`.

### 6.1 Where settings live and how they merge

`useInvoiceSettings.ts`:

```
base defaults  →  localStorage['invoiceTemplateSettings']  →  initialSettings prop
companyInfo:  getCompanyInfo()  →  saved.companyInfo  →  initialSettings.companyInfo
```

Defaults: `logo = DEFAULT_COMPANY_LOGO`, `logoSize = "large"`, `language = "en"`, `selectedPaymentAccount = "both"`, `customTerms = ""`, `vatEnabled = true`, `vatRate = 0`, `currency = "EUR"`, `invoiceNumberPrefix = "INV-"`.

The whole settings object is written back to `localStorage` on every change and again when the invoice is saved. **These settings are per browser, not per company record** — see §10.

`companyInfo` is the exception: it is saved through `saveCompanyInfo()` → `company_settings` table (shared with proposals), and read back through a cached `getCompanyInfo()`.

### 6.2 Logo (`LogoSettings.tsx`)

- Upload any image; it is read with `FileReader` into a **base64 data URL** and stored inside the settings object (hence inside localStorage).
- Sizes: small / medium / large → preview `h-16 / h-20 / h-32`, PDF `60px / 80px / 120px`.
- "Reset to Default" restores `DEFAULT_COMPANY_LOGO` (`/lovable-uploads/f7433a5f-…png`).
- The PDF generator re-reads the logo from localStorage first, falling back to the passed settings.

### 6.3 Company information (`CompanyInformation.tsx`)

Fields: Company Name, Contact Person, Email, Phone, Registration Number, VAT ID, and a free-text Address box parsed line-by-line into `street` / `postal + city` / `country`. Saved immediately to `company_settings`.

Defaults (`companyInfo.ts`): **AB MEDIA TEAM LTD**, Andreas Berger, Weseler Str. 73, 47169 Duisburg, Germany, registration 15746871, VAT 13426 27369.

### 6.4 Payment information (`PaymentInformation.tsx`)

Three hard-coded accounts in `constants.ts`:

| id | Account | Details |
|---|---|---|
| `belgium` | Belgian Bank Account | IBAN BE79967023897833, BIC TRWIBEB1XXX, BLZ 967, account 967023897833 |
| `germany` | German Bank Account | IBAN DE91240703680071572200, BIC DEUTDE2HP22, Postbank/DSL |
| `uk` | UK Bank Account (Wise) | IBAN GB73 TRWI 2314 7059 8496 33, sort 23-14-70, acct 59849633 |

`selectedPaymentAccount` accepts `belgium | germany | uk | both`. **`both` renders Belgium + Germany only** (not the UK account) in both the preview and the PDF. Account names are translated per language; the numbers are not.

### 6.5 Invoice settings (`InvoiceSettings.tsx`)

- **Language** — 23 options.
- **Currency** — 10 options.
- **Invoice Number Prefix** — cosmetic only: it is prepended to the displayed number in the preview and PDF header. The stored `invoice_number` always starts with `INV-`, so with the default prefix `INV-` the document header reads `INV-INV-2026-001` unless the prefix is cleared. **(known quirk)**
- **VAT Rate (%)** — a template-level field that is **not** applied to line items; per-line `vat_rate` is what actually drives the maths.
- **Enable VAT** — hides/shows the VAT row and zeroes VAT in the preview and PDF totals only. It does not change stored line data.
- **Custom Terms** — replaces the default terms block; the placeholder shows the default text for the chosen language.

---

## 7. Language, currency and VAT

### 7.1 Translations (`invoiceTranslations.ts`)

Four tables, all keyed by language code with an English fallback:

- `INVOICE_LABELS` — date, due date, balance due, bill to, item, quantity, rate, amount, subtotal, tax, total, notes, bank details, IBAN/BIC/BLZ/account/bank, contact person, registration number, UID number. 23 languages.
- `ACCOUNT_NAME_TRANSLATIONS` — the three bank-account display names.
- `PAYMENT_PANEL` — labels for the settings panel.
- `LINE_ITEMS` — ten canonical service names (Consulting, Development, Marketing…) translated automatically when a description matches exactly; anything else is passed through unchanged.
- `DEFAULT_TERMS` in `constants.ts` — the 3-day payment request paragraph in 23 languages.

Missing key or unknown language → the English entry; unknown label key would fall through to `INVOICE_LABELS.en`.

### 7.2 Currency

`formatCurrency(amount, code)` = symbol + `amount.toFixed(2)` — e.g. `€399.99`. **This is a dot-decimal format, not the European comma format** used elsewhere in the CRM. `currencyUtils.ts` also holds hard-coded exchange rates and a `convertCurrency` helper that is not used in the invoice flow.

### 7.3 VAT

- Stored per line as a fraction; the effective rate printed on the document is derived from the lines: if every line shares a rate, that rate is shown; if they differ, it prints `vat / net` as a blended percentage.
- `vatEnabled = false` suppresses the VAT row and the VAT amount in preview/PDF totals, while the DB keeps the per-line VAT.
- The gross-anchored editor (§5.1) implements the rule "the price you type is what the client pays".

---

## 8. Preview and PDF

### 8.1 Preview (`InvoicePreview.tsx`)

A React rendering of the document: header (logo + company block + big invoice number), Bill-To panel, date/due/balance column, line table with a navy header (`#1e3a5f`), totals box, notes and bank details. Font: Epilogue.

Sample-data behaviour: with no line items it shows a "Sample Service" row at 750; with no client it shows placeholder client text; totals fall back to 750 when zero.

### 8.2 PDF (`invoicePdfGenerator.ts`)

Not a drawn PDF — an **HTML snapshot**:

1. Build an off-screen 794 px (A4 at 96 DPI) container.
2. Generate the same document as an HTML string, sanitise it (`sanitizeHtml`), inject it.
3. Wait for all images to load.
4. `html2canvas` at scale 2 on a white background.
5. Put the PNG into a jsPDF A4 portrait document; if taller than 297 mm, add pages by shifting the same image up one page height at a time.
6. `generateInvoicePDF` saves `invoice-<number>.pdf`; `generateInvoicePDFBase64` returns a data URI for emailing.

Differences from the preview: Arial/Segoe rather than Epilogue, a grey (`#374151`) table header instead of navy, and the Notes block falls back to `formData.notes` before the default terms. Dates are formatted `en-GB` ("5 Sep 2026") regardless of the invoice language.

Consequences of the snapshot approach: no selectable text, no clickable links, page breaks can cut through a row, and file size grows with page count.

### 8.3 Where each is reachable

- **Preview tab** — live, always current with unsaved edits.
- **Download PDF** — Edit tab sidebar and Preview tab; uses the current form state, so it works before saving.
- **Send to Client** (Preview tab) — generates the base64 PDF and opens the send dialog.

---

## 9. Sending to the client

### 9.1 Path 1 — `SendInvoiceDialog` (no attachment)

Opens from the Edit tab. Lets the user pick an email template (`type: 'invoice'`), edit subject/body, and add a custom message. On send:

1. Fire-and-forget `EmailService.sendInvoiceEmail(invoice.id, client.email, customMessage)` → edge function `send-invoice-email`. **(to confirm: no `send-invoice-email` function exists in `supabase/functions/`; only `send-invoice-pdf` and `send-invoice-payment-reminders` are deployed — this path most likely fails silently.)**
2. Arms `next_reminder_at` if not already set, using `reminder_interval_hours` (fallback 168 h).
3. Moves `draft` → `sent`.
4. If the invoice is linked to an order, toggles the order's **Invoice Sent** status.
5. Also offers a Payment Links tab (records only, §4.4).

### 9.2 Path 2 — `SendInvoicePDFDialog` (attachment) — the working path

Fields: client name (read-only), client email (prefilled from `bill_to_email`, else the client), subject, invoice language, message; subject and message templates come from `monthlyInvoiceTemplates.ts` in 10 languages and carry the AB MEDIA signature.

On send:

1. `generateInvoicePDFBase64(...)` renders the PDF in the browser.
2. Fire-and-forget `supabase.functions.invoke('send-invoice-pdf', { client_email, subject, message, pdf_base64, invoice_number })`.
3. Same post-send bookkeeping as path 1: arm the reminder, `draft → sent`, sync the linked order.

### 9.3 Edge function `send-invoice-pdf`

- Requires a Bearer JWT and a valid Supabase user; 401 otherwise.
- Validates `client_email`, `pdf_base64`, `invoice_number` and the email format.
- Uses `RESEND_API_KEY_ABMEDIA`; sender is **`AB Media Team <noreply@abm-team.com>`** (the only verified sending domain).
- Sends the client mail with the PDF attached as `invoice-<number>.pdf`; a client-side failure throws (500 to the caller).
- Then notifies a hard-coded list of 12 internal addresses with the same attachment, in batches of 2 with a 1-second delay, using `Promise.allSettled` so team failures never fail the request.
- Success payload: `{ success: true, message: "Invoice sent to <email>" }`.

Failure behaviour: because the invoke is fire-and-forget, the UI shows "Invoice sent" even if Resend rejects the message — the only record is the function log.

---

## 10. Lifecycle

```text
                  manual / order toggle / proposal / monthly installment
                                      |
                                      v
                                  [ draft ]
                                      |  send (email or PDF)
                                      v
                                  [ sent ] ---- reminder cron (7d default, escalating)
                                   |    \
                     partial payment|     \ full payment
                                    v      v
                        [ partially_paid ] [ paid ]  -> reminders cleared
                                    |
                        past due date (manual)
                                    v
                               [ overdue ]

  [ cancelled ]  <- order set to Cancelled (unpaid invoices only, auto_cancelled_by_order = true)
        |  order un-cancelled -> back to sent (if order was Invoice Sent) or draft
  [ refunded ]   <- manual
```

| Status | Set by | Effects |
|---|---|---|
| `draft` | default on insert | not chased; editable |
| `sent` | send dialogs, `sync_invoice_status` from an order's **Invoice Sent** | arms `next_reminder_at` |
| `partially_paid` | payment trigger | clears `next_reminder_at`; still counted as outstanding in the list |
| `paid` | payment trigger (paid ≥ total), order **Invoice Paid** | clears reminders; with Resolved it triggers the Google review request |
| `overdue` | manual only — **there is no job that marks invoices overdue automatically** | display only |
| `cancelled` | order cancellation automation or manual | reminders cleared; excluded from the one-active-invoice-per-order index, so a replacement can be created |
| `refunded` | manual | treated as settled by the balance helpers |

`sync_invoice_status` rejects any value outside this set.

---

## 11. Rebuild notes

Things to keep:

- **Totals in the database, never in the browser.** The trigger chain (`update_line_item_total` → `recalculate_invoice_totals`) means every client — UI, cron, edge function — sees the same numbers.
- **The atomic save RPC** (`update_invoice_with_lines`) with a whitelisted header and delete-missing line handling.
- **Gross-anchored line editing** — matching how the business actually quotes prices.
- **The audit log that never throws** — invaluable for diagnosing 409s.
- **Numbering that scans real invoice numbers** and never rewinds the sequence.
- **Bill-To overrides** separate from the client record.

Things to change in a fresh build:

1. **Template settings live in `localStorage`.** Logo, language, currency, payment account, prefix, custom terms and VAT toggle are per browser, so two colleagues can produce visually different invoices for the same record, and nothing is reproducible after the fact. Store them per tenant in the database and snapshot the used values onto the invoice at send time.
2. **Base64 logos inside localStorage** — move to file storage with a URL.
3. **Payment accounts are hard-coded in three places** (`constants.ts`, the preview, the PDF generator). Make them a table.
4. **`invoiceNumberPrefix` double-prefixes** the displayed number. Separate "prefix used for numbering" from "prefix shown on the document", or drop the display prefix.
5. **Template `vatRate` is dead weight** — it configures nothing; per-line rates are authoritative.
6. **PDF is a rasterised HTML snapshot.** Use a real PDF layout engine (server-side) for selectable text, proper page breaks, and smaller files.
7. **`formatCurrency` is dot-decimal** while the rest of the CRM uses European formatting; unify and make it locale-aware.
8. **Creation is non-transactional** — invoice insert then per-line inserts with a manual delete on failure. Do it in one RPC like the update path already does.
9. **Two send paths, one of them pointing at a function that does not exist.** Collapse to a single send service.
10. **Fire-and-forget sending** reports success before the provider answers. Record a delivery row and reflect real status.
11. **Recipient list hard-coded in the edge function** (12 addresses) — make it configurable.
12. **No automatic `overdue`** transition, and `partially_paid` clears the reminder schedule, so part-paid invoices stop being chased. Both should be jobs/policies.
13. **`convertProposalToInvoice` bypasses `createInvoice`** — no retry, no audit, no order link. Route everything through one creation function.
14. **Auto-save on unmount saves the header only**, so line-item edits can be lost when navigating away without saving. Make the save explicit or cover lines too.
