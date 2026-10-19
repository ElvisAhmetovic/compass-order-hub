# Cancel duplicate monthly invoices

## What will change
Mark the extra invoices as **cancelled** (red X with reason "Duplicate monthly invoice"). They stay in the records. The client gets no email, and reminders stop.

- **Medpassion, September 2026:** cancel **INV-2026-1595** (still open, would keep getting reminders). Keep INV-2026-1469 and INV-2026-1594 (paid), one per package.
- **Hgdk, April 2026:** cancel **INV-2026-541**. Keep INV-2026-519.

## Left untouched
- Cleanteam June/July (you're not sure; they name different packages).
- Classic-Immobilien, The Cube, Carplace and Medpassion's other months: these clients have more than one package, so two invoices a month is correct.
- Auto Garage Jimmy October: already cancelled earlier.

## Technical details
- Data change: set `status='cancelled'`, cancellation metadata/reason, and clear `next_reminder_at` for the two invoices. No deletes, no edge function calls, so no cancellation email.
- Check afterwards that the Medpassion monthly installment points to a remaining valid invoice. Then re-run the duplicate query to confirm only multi-package clients still show two invoices per month.
