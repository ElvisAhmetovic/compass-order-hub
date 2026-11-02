# Monthly Packages: stop a package, and the "15th" invoices

## 1. Stop a package without deleting it
Right now each package only has a red Delete button, and it erases everything. I'll add a **Stop package** button next to it:
- Clicking it asks for confirmation and an optional reason.
- The package changes to **Stopped**. The client's details, all past months and all invoices stay as they are.
- Automatic monthly billing and catch-up only bill packages that are still Active, so a stopped package gets no new invoices.
- Unpaid months that haven't been invoiced yet are marked as stopped, so nobody bills them by accident. Invoices that were already sent stay open, so the client still owes them.
- A **Resume** button turns the package back to Active. Billing then starts again from the next month.
- A stopped package stays in the list with a grey "Stopped" label. The "Active Contracts" count leaves it out.
- Delete is still there, but the warning now suggests stopping instead.

## 2. Classic-Immobilien: invoices on the 15th
I checked the records. No invoice was sent on the 15th:
- Both November invoices (INV-2026-1827 and 1859) were created and sent on **2.11.2026**. **15.11.2026** is only their **due date**, the 14-day payment deadline.
- There are two invoices because the same email address has **two separate 170 € packages**: "Classic Immobilien Berlin" and "Classic-Immobilien und Verwaltung Göttingen". Both show the Göttingen name because they share the same email.
- INV-2026-1551 (3000 €, 14.9.) was created by hand. It didn't come from the monthly billing.

What I'll fix: each package's invoice will show its **own** client name and address, so the Berlin invoice says Berlin.
If the Berlin package is a mistake, you can stop it with the new button.

## Technical details
- `monthly_contracts.status` gets the new value `stopped`, plus `stopped_at` and `stopped_reason` columns (migration). Billing already filters on `status = 'active'`.
- Add Stop/Resume actions and a badge in `MonthlyInstallmentsTable.tsx`, and update the counts in `MonthlyPackages.tsx`.
- In `generate-monthly-installments`, take the invoice client name and address from the contract instead of matching by email. Redeploy it.
- Add a small test: a stopped package is never billed.
