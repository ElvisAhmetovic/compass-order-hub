## Recommended fix: do #1, #2, #3 together

These three close every real incident you've actually hit (Magnum double-create risk, Nousgerons hijack, empty audit log). #4–#7 are nice-to-haves that become much cheaper to add once these three are in.

---

### Why this combination

| Incident you hit | Root cause | Fix that closes it |
|---|---|---|
| Magnum invoice "didn't appear" / double-click risk | No DB guard against two invoices per order; JS-only existence check has a race window | **#1** DB-level one-invoice-per-order + RPC upsert |
| Nousgerons invoice filed under Investissement Locatif | Client lookup matches by email alone when two companies share an email | **#2** Company-name must match before reusing a client |
| Audit log page is empty even after failures | RLS blocks the insert; fire-and-forget swallows the error | **#3** SECURITY DEFINER RPC for audit writes |

Doing only one leaves the other two incidents live. Doing all three is ~one migration + small service edits — same blast radius as doing them one at a time, but you stop firefighting.

---

### What I'll change

**1. One invoice per order, enforced in the DB**
- Migration: partial unique index `invoices(order_id) WHERE order_id IS NOT NULL AND status <> 'cancelled'`.
- New RPC `create_invoice_for_order(...)` (SECURITY DEFINER) that, in one transaction: locks the order row, returns the existing invoice if one exists, otherwise generates the number and inserts. Eliminates the JS race.
- `InvoiceService.createInvoice` calls the RPC for paths B and C; manual path A keeps current flow (no `order_id`).

**2. Stop the email-only client hijack**
- Update the client lookup in `OrderActions.tsx` and `orderService.ts`:
  - Match `name + email` exact → reuse.
  - Match by `email` only AND client.name overlaps order.company_name → reuse.
  - Otherwise **create a new client** (do not reuse a same-email row from a different company).
- Re-link any historical invoice whose client name no longer matches its order's company (one-time corrective UPDATE, scoped + reported in chat before running).

**3. Audit log that actually records**
- New RPC `log_invoice_audit(payload jsonb)` SECURITY DEFINER, inserts into `invoice_audit_logs`. RLS stays read-restricted to super admins; writes go through the RPC so any signed-in user (and edge functions) can log.
- `InvoiceAuditService.log` switches to calling the RPC. Keep fire-and-forget but surface failures to `console.error` so we'd notice next time.
- Backfill nothing — just start capturing from now.

**Out of scope for this pass** (can do next): #4 client email uniqueness/merge tool, #5 button-in-flight disable, #6 partial-failure toast wording, #7 orphan-invoices view.

### Technical notes
- The partial unique index will fail to create if duplicate `(order_id)` rows already exist. I'll run a read query first to list any duplicates and ask you how to resolve them (keep newest, merge, or cancel one) before the migration.
- The RPC pattern means `invoice_audit_logs` RLS can stay strict (super-admin read), which is what you want.
- No changes to invoice numbering — last turn's retry-loop already covers that.

Want me to proceed with all three, or just a subset?
