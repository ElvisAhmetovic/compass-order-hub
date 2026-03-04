

## Auto-Link All Matching Orders on Portal Creation/Linking

### Problem
When a client portal is created or linked for one order, only that specific order gets `client_id` set. Other existing orders with the same `contact_email` remain unlinked, so the client can't see their full order history in the portal.

### Solution
After creating or linking a client portal account, run a bulk update to set `client_id` on ALL orders matching the client's email (via `contact_email`). This happens in two places in `CreateClientPortalModal.tsx`:

### Changes

**`src/components/dashboard/CreateClientPortalModal.tsx`**

1. **Modify `linkEntityToClient`** — after updating the specific entity, also bulk-update all orders where `contact_email` matches (case-insensitive) and `client_id` is null:
   ```typescript
   // After linking the specific entity:
   const { data: linkedOrders } = await supabase
     .from("orders")
     .update({ client_id: userId })
     .ilike("contact_email", clientEmail)
     .is("client_id", null)
     .select("id");
   ```

2. **Log the bulk assignment** — add an audit log entry noting how many additional orders were auto-linked.

3. **Show feedback** — update the success toast to mention if additional orders were also linked (e.g., "Linked 3 additional orders to this client portal").

This applies to both flows:
- "Create & Send Invite" (new account)
- "Link to This Order" (existing account)

No database changes needed — just updating the client-side logic to do a broader `UPDATE` instead of a single-row one.

