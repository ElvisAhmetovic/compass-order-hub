

## Add Invoice Number Search Across Dashboard, Invoices, and Other Pages

### Problem
Currently, the global search on the dashboard searches orders by company name, email, description, address, and assigned agent — but not by invoice number. The invoices page only searches by invoice number and client name/email locally. There is no cross-referencing between invoices and orders/companies/clients in search results.

### Solution
Extend the existing search infrastructure to include invoice number/client name lookups, and when a match is found, surface the related order/company/client information.

### Changes

**1. `src/services/searchService.ts`** — Extend `globalSearch` and `applyFiltersToOrders`
- In `globalSearch()`, also query the `invoices` table (with joined `clients` data) by invoice number and client name
- Return invoice results alongside orders/companies/clients
- In `applyFiltersToOrders()`, when the `globalSearch` term matches an invoice number, also include orders whose `company_name` or `contact_email` matches the invoice's client

**2. `src/services/searchService.ts`** — Add `SearchFilters.invoiceNumber` field
- Add optional `invoiceNumber?: string` to the `SearchFilters` interface
- Handle it in `applyFiltersToOrders` by cross-referencing with invoices table

**3. `src/components/dashboard/AdvancedSearch.tsx`** — Update search placeholder and logic
- Change placeholder to: `"Search orders, invoices, companies, clients..."`
- The global search input already feeds into `SearchFilters.globalSearch`, which will now also match invoice numbers

**4. `src/components/dashboard/OrderTable.tsx`** — Enhance filtering
- When search filters are applied, also fetch invoices matching the search term
- Cross-reference invoice client IDs with order company names to show related orders
- Display a small invoice badge on order rows that have matching invoices

**5. `src/pages/Invoices.tsx`** — Enhance the existing search
- Extend `filteredInvoices` filter to also search by `invoice.status`, amounts, and show the linked client/company info more prominently
- Already searches by invoice_number and client name — this is mostly fine

**6. New: `src/services/invoiceSearchService.ts`** — Lightweight cross-reference helper
- `searchByInvoiceNumber(query)` — returns invoices with their client data
- `getInvoicesForClient(clientId)` — returns all invoices for a client
- Used by both Dashboard and Invoices pages

### How it works end-to-end
1. User types an invoice number (e.g., "INV-2026-001") in the dashboard search bar
2. The search service queries the `invoices` table for matching `invoice_number`
3. From matching invoices, it gets the `client_id` and looks up the client
4. It then finds orders whose `contact_email` or `company_name` matches the client
5. Those orders appear in the dashboard results, with an invoice badge showing the matched invoice number
6. Same logic works on the Invoices page — searching by company name shows related invoices

### Files to create/modify
- **Create**: `src/services/invoiceSearchService.ts`
- **Modify**: `src/services/searchService.ts` (add invoice search to globalSearch and applyFiltersToOrders)
- **Modify**: `src/components/dashboard/AdvancedSearch.tsx` (update placeholder)
- **Modify**: `src/components/dashboard/OrderTable.tsx` (integrate invoice cross-reference in filtering)
- **Modify**: `src/pages/Invoices.tsx` (enhance search to also match by company/order data)

