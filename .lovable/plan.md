

## Add Search Bar to Offers Page

### What
Add a search input at the top of the Offers page that filters offers in real-time by client name, company name, or email.

### How
**File: `src/pages/Offers.tsx`**
- Add a `searchTerm` state variable
- Add an `Input` search field next to the header (similar pattern to `CompanySearch.tsx`)
- Filter the `offers` array by `client_name`, `company_name`, or `client_email` matching the search term (case-insensitive)
- Use filtered list for rendering the table

The search bar will sit between the page header and the table, with a clear button.

