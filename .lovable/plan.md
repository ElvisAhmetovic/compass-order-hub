# Test login for the client portal

Real client passwords can't be looked up, because they are stored scrambled. Resetting a real client's password would lock that client out and send them an email, so I won't do that. Instead I'll make a separate test client.

## What I'll do
1. Create a test client account with the email **invoice+portaltest@mediaamarketing.com**. Any email it gets lands in your invoice inbox, never with a real client.
2. Give it some sample data so the portal isn't empty:
   - a test order called "QA Test – Portal preview" (status In progress, €399,99);
   - a test monthly package (€399,99 per month, 12 months, bank transfer, so nothing goes to Stripe), plus one open invoice.
3. Send you the email and password here in chat once, along with the login page: https://www.empriatech.com/client/login
4. You log in and look around: Dashboard, Orders, Invoices & Billing, Support.
5. When you're finished, tell me "delete test client" and I'll remove the account, order, package and invoice.

## Things to know
- This adds test records to the live system. All of them are named "QA Test" so nobody mistakes them for a real client.
- Your team's lists and totals will show the test order and package until they're deleted. Real clients won't see them.
- No real client is changed or emailed.

## Technical details
- Create the account with the `ensure-client-portal` logic using a service-role call, with the welcome email turned off. Or create it directly with the auth admin API, then add `profiles`, `user_roles` (client) and `app_users`.
- Insert the order with `contact_email` and `client_id` set, the `monthly_contracts` row (`payment_method` bank_transfer), one `monthly_installments` row, and a matching `clients` row so the portal invoice lookup works.
- Record every new ID so cleanup can delete exactly those rows.
