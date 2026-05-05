## Fix

In the team notification email sent by `generate-monthly-installments`, change the German label:

- Current: `Rechnungsnr.:`
- New: `Rechnung Nr.:`

## File

- `supabase/functions/generate-monthly-installments/index.ts` (line 665) — single label change in the HTML table.

No other content, logic, or styling changes.