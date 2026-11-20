# Export order and client emails to a spreadsheet

A one-off Excel file saved to your Files. The app stays the same. Live data is only read, never changed.

## What you get
One Excel file (`client-and-order-emails.xlsx`) with three tabs:

1. **All emails**: every unique email address, with its name/company, where it came from (Client, Order or both), the number of orders and the date of the latest order.
2. **Clients**: every client with their name, company, email, phone and the date they were added.
3. **Orders**: every order with its order number, company/contact name, contact email, status, price (shown the European way, e.g. €399,99) and the date it was created.

## Rules
- Deleted orders and the QA test client (invoice+portaltest@...) are left out.
- Emails are trimmed and compared without caring about capital letters, so there are no duplicates in "All emails".
- Empty or broken emails are listed at the bottom of the Orders tab, marked "missing".

## Technical details
- Read-only SELECT queries on `clients` and `orders` (where `deleted_at` is null), with emails grouped by lower(trim(email)).
- Build the file with openpyxl: frozen header row, Arial font, auto-filter, readable column widths.
- Check it by opening it again and comparing row counts with the database counts before delivering it.
