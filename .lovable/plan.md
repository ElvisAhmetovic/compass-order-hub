

## Fix RLS on `invoice_line_items` to Allow Team Access

### Problem
The current RLS policies on `invoice_line_items` restrict all operations (INSERT, UPDATE, DELETE, SELECT) to only the user who created the parent invoice (`invoices.user_id = auth.uid()`). Any other authenticated team member — including admins and agents — gets "new row violates row-level security policy".

### Fix
Replace the two existing policies with ones that also allow admins and agents:

**SQL Migration:**
1. Drop the two existing policies on `invoice_line_items`
2. Create new policies that check: user owns the invoice **OR** user has role `admin` **OR** user has role `agent` (using the existing `has_role()` security definer function)

Same pattern should also be checked on the `invoices` table to ensure consistency — if invoices RLS is similarly restrictive, fix that too.

### Changes
- **Database migration only** — no code file changes needed
- Drop & recreate 2 RLS policies on `invoice_line_items`
- Verify and fix `invoices` table policies if needed

