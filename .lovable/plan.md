

## Fix: Offers Page Not Updating in Real-Time

### What Happened
The FederTec offer **was confirmed successfully** -- the database shows `status: confirmed` and the order was created. The issue is that the Offers page only loads data once on mount and has **no real-time subscription**. So when the client confirmed from their side, the boss's browser still showed the old "unconfirmed" state.

### Solution
Add a Supabase real-time subscription on the `offers` table in `src/pages/Offers.tsx` so the list auto-refreshes whenever an offer is inserted, updated, or deleted. This is the same pattern used elsewhere in the app (e.g., orders real-time).

### Change

**`src/pages/Offers.tsx`** -- Add a `useEffect` with a Supabase channel subscription:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('offers-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
      fetchOffers();
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

This ensures the table updates live when a client confirms an offer, or when any other change happens to the offers table.

