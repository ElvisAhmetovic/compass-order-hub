

## Add Search Bar to Monthly Packages

### What
Add a search input at the top of the Monthly Packages page (between the stats cards and the table) that filters contracts and their installments by client name, email, or website in real-time.

### How

**`src/pages/MonthlyPackages.tsx`**
1. Add `searchTerm` state
2. Add a search `Input` with a `Search` icon between the stats grid and the table
3. Filter `contracts` and `installments` by `searchTerm` before passing to `MonthlyInstallmentsTable`:
   - Match contracts where `client_name`, `client_email`, or `website` includes the search term (case-insensitive)
   - Filter installments to only those whose `contract_id` matches a filtered contract
4. Also update the stats cards to reflect filtered data

No changes needed to `MonthlyInstallmentsTable` — the filtering happens at the page level before data is passed down.

