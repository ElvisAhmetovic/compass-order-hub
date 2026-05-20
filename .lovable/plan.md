# App-wide overflow audit and fix

## Findings

- **Page wrapper pattern**: 29 pages use the bare `<div className="flex-1 flex">` wrapper between `<Sidebar />` and `<Layout>` without `min-w-0`. This is the exact root cause of the Monthly Packages overflow. Any page whose content has a wide child (long table row, long unbroken string, fixed-width panel) will push the page wider than the viewport.
- **Tables**: shadcn's `<Table>` component already wraps its `<table>` in `<div className="relative w-full overflow-auto">`, so raw `<Table>` usage self-contains horizontal overflow. No per-table fixes needed.
- **Layout itself**: already has `min-w-0` (fixed in earlier turn).

## Fix
Apply the same one-line wrapper fix across all 29 pages:

`className="flex-1 flex"` → `className="flex-1 flex min-w-0"`

Affected pages (all under `src/pages/`):
Offers, UserStatistics, NotificationSettings, InvoiceDetail, Inventory, Instagram, UserManagement, TextLibrary, Facebook, Support, CustomerTicketDetail, EmailManagement, Deleted, Invoices, Clients, Rankings, Dashboard, CustomerTickets, Analytics, ProposalDetail, Reviews, Companies, Trustpilot, TeamCollaboration, TrustpilotDeletion, Settings, Proposals, SupportDetail, GoogleDeletion.

Pure layout containment — no logic, data, or styling changes. Done as a blanket `sed` across the listed files.
