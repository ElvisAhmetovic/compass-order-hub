# Hide company money totals from everyone except 3 people

## Who can see the totals
Only these accounts (matched by login email):
- Johann Nowak — business@team-abmedia.com
- Thomas Klein — kontakt.abmedia@gmail.com (admin account)
- Max Pfenning — luciferbebistar@gmail.com

Everyone else — other admins, agents, workers, clients, and any account created in the future — will not see them. New accounts are blocked automatically because the list is fixed, not role-based.

Note: there is a second "Thomas Klein" login (kleinabmedia@gmail.com, a client account). It will NOT see the totals unless you want it added.

## What gets hidden
- Dashboard: "Owed to us", "Overdue", "Invoiced this month" cards.
- Invoices page: "Total Outstanding" and "Paid" (with month picker) cards. "Total Invoices" count stays visible.
- Monthly Packages: "Revenue (paid)" card. Contract/installment counts stay visible.

Hidden cards are simply removed (no empty boxes); the remaining cards spread out to fill the row.

## Technical details
- New `src/config/financeAccess.ts` with `FINANCE_VIEWER_EMAILS` and `canViewFinanceTotals(email)` (lowercased compare).
- `Dashboard.tsx`: replace `isAdmin && <FinanceSummaryCards />` with the check.
- `Invoices.tsx` (~line 648) and `MonthlyPackages.tsx` (~line 108): conditionally render the cards, adjust grid columns.
- Screen-level hiding only; invoice rows themselves stay accessible to staff who already work with invoices (unchanged). Record the rule in AGENTS.md.
