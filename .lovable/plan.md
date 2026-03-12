

## Auto-Link Repeat Client Orders to Existing Portal Accounts

### Problem
When a new order is created for a client who already has a portal account (from a previous order), the new order doesn't get automatically linked to that client. The admin has to manually go into the order → Client Access → select client. This should be automatic.

### Solution
After every order creation, check if the `contact_email` matches any existing order that already has a `client_id` set. If so, auto-assign that `client_id` to the new order so it immediately shows the green portal icon.

### Changes

#### 1. `src/services/orderService.ts` — `createOrder` method
After the order is inserted and company sync runs, add a new block:

```typescript
// Auto-link to existing client portal account by matching contact_email
try {
  if (data.contact_email) {
    const { data: matchingOrder } = await supabase
      .from('orders')
      .select('client_id')
      .ilike('contact_email', data.contact_email.trim())
      .not('client_id', 'is', null)
      .neq('id', data.id)
      .limit(1)
      .maybeSingle();

    if (matchingOrder?.client_id) {
      await supabase.from('orders').update({ client_id: matchingOrder.client_id }).eq('id', data.id);
      data.client_id = matchingOrder.client_id;
      console.log('Auto-linked order to existing client portal:', matchingOrder.client_id);
    }
  }
} catch (e) {
  console.error('Failed to auto-link client portal:', e);
}
```

#### 2. `src/services/orderService.ts` — `createYearlyPackage` method
Same auto-link logic after the yearly package is created.

#### 3. `supabase/functions/confirm-offer/index.ts`
After the order insert (line ~80), add the same check: query orders table for matching `contact_email` with a non-null `client_id`, and if found, update the newly created order's `client_id`.

### What This Achieves
- New orders for repeat clients instantly show the green `UserCheck` icon
- The order is immediately visible in the client's portal
- No manual "Link Client" step needed for returning customers
- Works for all three creation paths: manual order, yearly package, and offer confirmation

