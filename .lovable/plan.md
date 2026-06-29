## QA Diagnosis — Why Invoices Break

This is a diagnosis only. No code changes — I'll wait for your go-ahead before fixing anything.

---

### 1. How the system works today

There are **three entry points** that can create an invoice, and they all share the same underlying service:

```text
A) Invoices page  → "Create Invoice" button     → InvoiceService.createInvoice
B) Order row      → "Create Invoice" action     → OrderActions.createInvoiceFromOrder → InvoiceService.createInvoice
C) Order status   → toggle to "Invoice Sent"/"Invoice Paid"
                                                 → orderService.toggleOrderStatus → InvoiceService.createInvoice
```

Inside `InvoiceService.createInvoice` the flow is:

1. Authenticate user.
2. Call DB function `generate_invoice_number('INV')`, which:
   - Reads the highest existing `INV-{year}-N` from `invoices`.
   - Upserts into `invoice_sequences` and returns `INV-{year}-N+1`.
   - Loops forward if that number is somehow already taken.
3. `INSERT INTO invoices` with that number.
4. If insert fails with `23505` on `invoice_number`, retry up to 5 times.
5. Insert line items one-by-one. If any line item fails, the invoice is hard-deleted.
6. For B/C: a second `UPDATE invoices SET order_id = ...` links it to the order, then a third `UPDATE` (or `sync_invoice_status` RPC) sets `sent` / `paid`.
7. Every attempt logs into `invoice_audit_logs` (Super Admin → "Invoice Audit Log" page).

**Client resolution** (B/C): match `clients` row by `name + email` exact → fallback to `email` only (preferring name overlap) → fallback to `name` only → otherwise create a brand-new `clients` row.

---

### 2. Root causes of the breakage you've been seeing

Confirmed by reading the code and the DB constraints (`invoices.invoice_number` UNIQUE; `invoices.order_id` is NOT unique; `clients.email` is NOT unique):

**A. Duplicate clients with the same email silently hijack invoices.**
`clients` has no uniqueness on email, but the lookup matches by email first. So when Investissement Locatif and Nousgerons share `johann@…`, the new Nousgerons invoice was attached to Investissement Locatif's client row → it "disappeared" from any search by "Nousgerons". This is the Nousgerons incident.

**B. Multiple invoices for the same order are allowed.**
The "does an invoice for this order already exist?" check is done in JS by fetching `getInvoices()` and scanning. There is **no DB-level unique constraint on `invoices.order_id`**. Two consequences:
- If the boss double-clicks the button, or toggles status while the page is creating one manually, two invoices for the same order can be created (race condition).
- If the first attempt created the invoice but the second `UPDATE … SET order_id` failed silently, the existence check misses it and a duplicate is created next try.

**C. Invoice numbering uses two sources of truth.**
`invoice_sequences` and `invoices.invoice_number` are reconciled at generation time, but if anyone manually edits an invoice number (or a sequence row gets stuck behind reality), the function spins through `23505` conflicts. The retry loop saves the visible call, but each conflict still pollutes `invoice_audit_logs` and burns invoice numbers (gaps in `INV-2026-…`).

**D. "Invoice created but doesn't show up" is usually one of three things:**
1. Hijacked client (cause A) — invoice exists, just under the wrong client name, invisible to a search by company.
2. Sort/filter on the Invoices page — invoices are sorted by `created_at DESC`, but anything filtered by status / date range can hide a new draft. Until last turn the issue-date sort was burying same-day invoices.
3. Partial failure path: `invoices` row inserted, then a follow-up `UPDATE` (order_id / status) failed → toast shows error → user assumes "nothing happened", but the invoice IS in the table (just as draft, unlinked).

**E. "Can't create at all" failure modes we have observed:**
1. `23505 invoices_invoice_number_key` when the sequence drifts (fixed last turn with retry + loop).
2. Line-item insert fails (e.g., a `unit` value with bad casing, or `vat_rate` null) — the code then deletes the invoice. The user sees the failure but no invoice.
3. Auth race: `supabase.auth.getUser()` returns `null` mid-session refresh → "Authentication required" toast even though the user is logged in.
4. Non-admin trying to create an invoice on an order not assigned to them — `OrderActions` guards in UI but `toggleOrderStatus` can still attempt creation when the status toggle is fired from another surface.

**F. Audit log isn't capturing everything.**
`invoice_audit_logs` is currently empty in the DB even though invoices have been created today. The `void InvoiceAuditService.log(...)` calls are fire-and-forget Promises — if the insert is denied by RLS (only super-admin can read, and the writer policy may be the same), every write silently fails and we lose all forensic data. This is why you didn't see today's Magnum/Nousgerons attempts in the audit page.

---

### 3. What happens when "same" things are processed multiple times

**Same order, invoice button pressed twice:**
- Best case: 2nd press sees the 1st invoice via `getInvoices()` scan and just updates its status. Toast says "updated".
- Race case (clicks within ~1 s, or one is the status toggle and the other is the manual button): both run the existence check before either inserts → **two invoices** get created for the same order, with two different `INV-2026-N` numbers. Both link to the same `order_id`. Nothing in the DB stops this.

**Same client info (same email) used by two different companies:**
- The client lookup picks the first existing row by email. The new order's invoice attaches to that old client. The company name from the order is **never written** to the client row, so search by the new company name never finds the invoice. (Nousgerons case.)

**Same offer accepted twice and converted to an order:**
- `offers` → manual conversion to `orders` doesn't deduplicate. Two orders get created from one offer. Each can then spawn its own invoice via path B or C → up to 2 invoices, 2 client rows if emails were tweaked.

**Two admins toggle the same order to "Invoice Sent" simultaneously:**
- `toggleOrderStatus` runs the create flow on both sessions. The DB-level uniqueness on `invoice_number` saves you (one wins, the other retries with a higher number) — so you get **two invoices for one order**, not a crash. Order status flips twice; status history gets two entries.

**Same invoice number manually entered twice:**
- 2nd insert hits `23505`. The retry loop bumps the number forward. Caller sees success but with a different number than typed → confusing if the user expected exact control.

---

### 4. Highest-impact issues to fix (ordered)

1. Prevent duplicate invoices per order at the DB level (partial unique index on `invoices(order_id)` where `order_id IS NOT NULL` AND status != 'cancelled'), and convert the JS existence check to an upsert / RPC so the race window closes.
2. Stop letting the email match hijack a different company. Either include company-name similarity as a hard filter, or stop reusing a client row when the order's company name doesn't match the client's name → create a new client instead.
3. Make `invoice_audit_logs` writes succeed for all roles (RLS or a SECURITY DEFINER RPC), so we actually have forensics. Confirm policies; the table is empty today.
4. Add a DB-level uniqueness or merge tool for `clients(email)` so the Investissement Locatif / Nousgerons situation can't recur (or accept duplicates intentionally and key the lookup on `(name,email)` only — never on email alone).
5. Disable the "Create Invoice" button while a request is in flight on both `OrderActions` and the status toggle, and make the manual Invoices page check `order_id` server-side before insert.
6. Surface partial-failure invoices: if the invoice row was inserted but the follow-up `order_id`/status update failed, the toast must say "Invoice INV-2026-X created but not linked — open it in Invoices to finish."
7. Audit log page should also list **orphan invoices** (invoice exists, no `order_id`, was meant to be linked) so they don't appear lost.

---

### Want me to proceed?

Tell me which of #1–#7 (or all) you want me to implement. I'd recommend starting with **1, 2, 3** — those eliminate the three real-world incidents you've actually hit (Magnum double-create risk, Nousgerons hijack, empty audit log).