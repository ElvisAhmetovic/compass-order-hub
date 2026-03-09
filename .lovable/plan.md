

## Fix Invoice Permission Error

### Problem
The `addLineItems` method in `invoiceService.ts` (line 277) has a strict ownership check: `invoice.user_id !== user.id`. This blocks anyone who didn't originally create the invoice from editing it — including admins and other team members. The error shown is "You do not have permission to modify this invoice".

RLS on the database already handles access control properly. This client-side ownership check is redundant and overly restrictive.

### Fix

**`src/services/invoiceService.ts`** — In the `addLineItems` method (lines 258-281), remove the strict `user_id` ownership check. The method already verifies the user is authenticated. RLS policies on the `invoices` and `invoice_line_items` tables handle the actual authorization. Simply keep the authentication check and the invoice existence check, but remove the `user_id !== user.id` comparison that blocks team members.

Specifically, remove lines 277-280 (the `if (invoice.user_id !== user.id)` block), and simplify the invoice existence query to just check `select('id')` instead of `select('id, user_id')`.

