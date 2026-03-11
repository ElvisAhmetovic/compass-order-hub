

## Fix: Invoices Not Visible Due to RLS Policy Configuration

### Root Cause
The `invoices` table has two RLS policies, both marked as **RESTRICTIVE** (`AS RESTRICTIVE`). PostgreSQL requires at least one **PERMISSIVE** policy to grant base access — restrictive policies only narrow it down. With zero permissive policies, the SELECT returns no rows, which is why the Invoices page shows nothing even though the data exists.

The same issue applies to `invoice_line_items` — both policies there are also restrictive.

### Fix
Drop the existing restrictive policies and recreate them as **PERMISSIVE** (the default). Same conditions, just permissive instead of restrictive.

**Migration SQL:**
1. Drop `"Team can manage invoices"` and `"Team can view invoices"` on `invoices`
2. Recreate as permissive with same USING/WITH CHECK conditions
3. Drop `"Team can manage invoice line items"` and `"Team can view invoice line items"` on `invoice_line_items`
4. Recreate as permissive with same conditions

### Files
- **Migration only** — no code changes needed

