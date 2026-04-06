

## Add Offers to Order Autofill Search

### Problem
The "Search existing orders to autofill" dropdown in Create Order only pulls from the `orders` table. Clients who only have offers (but no orders yet) don't appear, so their details can't be autofilled.

### Solution
Extend `OrderSearchDropdown` to also fetch offers from the `offers` table, merge them into the search results, and map offer fields to the same shape so the autofill handler works seamlessly.

### How it works
- When the dropdown opens, fetch both orders AND offers in parallel
- Convert each offer to a lightweight "pseudo-order" object with the same fields the autofill uses (`company_name`, `contact_email`, `company_address`, `contact_phone`, `currency`, etc.)
- Parse `order_data` JSON from offers to extract `companyLink`
- Tag offer entries with a visual badge ("From Offer") so the user can distinguish them
- Deduplicate: if an order already exists with the same company name + email, skip the offer entry

### Technical details
- Offers have: `company_name`, `client_email`, `client_name`, `client_phone`, `client_address`, `currency`, `price`, `description`, `order_data` (JSON with `companyLink`)
- Map to Order-like shape: `company_name` stays, `client_email` → `contact_email`, `client_phone` → `contact_phone`, `client_address` → `company_address`, `order_data.companyLink` → `company_link`
- Priority defaults to "medium" for offers
- The `handleOrderAutofill` in CreateOrderModal already only copies company/client info and resets order-specific fields — no changes needed there

### Files to modify
1. **`src/components/dashboard/OrderSearchDropdown.tsx`** — Fetch offers alongside orders, merge into results list, add "Offer" badge for offer-sourced entries

