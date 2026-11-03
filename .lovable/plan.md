# Fix yearly packages billed every month (LeoClean) and duplicates

## What's wrong
- LeoClean has a 1.200 € package set to **every 12 months**, but the automatic billing ignores that setting and bills it **every month**. That's why an October invoice and a November invoice both went out.
- LeoClean also has 3 invoices: 26.10 (INV-2026-1782), 27.10 (INV-2026-1803) and 2.11 (INV-2026-1892). The first two look like a duplicate for October. I'll confirm from the records how each one was created (by hand, from the package, or by the catch-up) before changing anything.

## Fix
1. **Respect the billing interval**: the automatic billing (and the catch-up) only creates an invoice in the package's billing months, e.g. a 12-month package is billed once at the start and then 12 months later. Quarterly and 6-month packages work the same way. Monthly packages don't change.
2. **Show it correctly**: the package only lists the months that are actually billed (no extra "November" row for yearly packages).
3. **Stop duplicates**: before creating a package invoice, check for any open or paid invoice of the same amount for the same client in the same billing period, including ones created by hand. If one exists, skip it and link it instead.
4. **Clean up LeoClean** (after you confirm): cancel the extra invoices but keep a record (same as Medpassion), no emails to the client. Proposed: keep one invoice (the first, 26.10), cancel 27.10 and 2.11, and remove the wrong November month row.
5. **Check other packages**: list every package that isn't monthly and see whether any of them were also billed too often. I'll report them to you before cancelling anything.

## Tests
- A 12-month package started in October is billed in October and not again until next October.
- A 3-month package is billed every 3rd month.
- A second run in the same period never makes a second invoice.

## Technical details
- `generate-monthly-installments`: `monthNumber` gate becomes `(monthNumber - 1) % billing_frequency === 0`; skip with reason "Not a billing month"; installment count = duration / frequency. The same check goes in `monthly-billing-catchup`.
- Pre-insert dedup query on invoices by client email + amount + period window (frequency months), excluding cancelled.
- Data cleanup via SQL: invoice status = cancelled, reminders paused, `cancelled_at` set; delete the orphan installment row.
