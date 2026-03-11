

## Fix Offers Page: Add Sidebar + Delete Capability

### Problem
The Offers page wraps content in `<Layout>` but doesn't include `<Sidebar />` like Dashboard and other pages do. Also, the `offers` table has no DELETE RLS policy.

### Changes

**1. `src/pages/Offers.tsx`**
- Wrap with `<Sidebar />` + `<Layout>` pattern matching Dashboard (i.e. `<div className="flex min-h-screen"><Sidebar /><div className="flex-1 flex"><Layout>...</Layout></div></div>`)
- Add a delete button (Trash icon) in each row's Actions column
- Add a confirmation dialog before deletion
- Call `supabase.from('offers').delete().eq('id', offerId)` and refresh list

**2. Database migration**
- Add DELETE RLS policy on `offers` table for non-client authenticated users:
```sql
CREATE POLICY "Non-client authenticated users can delete offers"
ON public.offers FOR DELETE TO authenticated
USING (NOT is_client());
```

