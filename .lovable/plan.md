

## Add Sort/Filter Dropdown to Invoices Page

### What
Add a sort dropdown next to the search bar in the Invoices page that lets users sort by: status (Sent, Draft, Paid), date (Oldest, Newest), invoice number (Lowest, Highest), and client name (A-Z, Z-A).

### How

**`src/pages/Invoices.tsx`**

1. Add `sortOption` state with type like `'newest' | 'oldest' | 'sent' | 'draft' | 'paid' | 'inv-low' | 'inv-high' | 'a-z' | 'z-a'`, default `'newest'`

2. Add a `Select` component next to the existing search input (inside the card header flex row) with options:
   - Status filters: Sent, Draft, Paid
   - Date sorts: Newest, Oldest  
   - Invoice #: Lowest INV#, Highest INV#
   - Alphabetical: A-Z (client name), Z-A

3. Apply sorting/filtering after the existing `filteredInvoices` text search:
   - For status options (sent/draft/paid): filter to only that status, then sort by newest
   - For date options: sort by `issue_date` ascending or descending
   - For INV# options: extract the numeric sequence from `invoice_number` and sort
   - For A-Z/Z-A: sort by `client?.name`

4. Import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` and `ArrowUpDown` icon

