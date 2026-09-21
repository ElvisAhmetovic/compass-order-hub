# Make "Needs attention" items actually open something

Right now the three lines under "Needs attention" only count records and then send you to a page that shows everything:

- "Orders without a linked client" goes to the dashboard you are already on, so nothing happens.
- "Invoices without a linked client" opens the full invoice list, unfiltered.
- "Clients without a portal login" opens the full client list, unfiltered.

## What changes

Clicking a line expands it into a short list of the actual records, right there on the dashboard.

- Orders: shows order number, company and price. Clicking one opens that exact order.
- Invoices: shows invoice number, company and amount. Clicking one opens that invoice's page.
- Clients: shows name and email. Clicking one opens the client list with that client already searched for.

Each expanded list shows up to 10 records with a "View all" line when there are more. Clicking the heading again collapses it. Counts and the yellow warning look stay as they are.

## Technical notes

- `DataHealthWarnings.tsx`: switch the count-only queries to fetch the rows themselves (id plus a few display fields, limit 11 to detect overflow) while keeping the exact counts, and hold an `expandedKey` state.
- Navigation targets: orders -> `/dashboard?orderId=<id>` (the existing `?orderId=` handler on Dashboard opens the modal), invoices -> `/invoices/<id>`, clients -> `/clients?q=<email or name>`.
- `Clients.tsx`: read `q` from the URL once on mount into the existing `filterText` state so the filtered list lands on the right client. No other page logic changes.
- Verify with `npx tsgo --noEmit -p tsconfig.app.json` and the test suite.
