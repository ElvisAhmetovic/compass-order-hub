

## Stop Dashboard Refreshes on Tab Switch

### Root Cause

The `refetchOnWindowFocus: false` and the `setUser` guard are working — they prevent React Query and context-level re-renders. But Supabase's built-in `onAuthStateChange` still fires `TOKEN_REFRESHED` events when returning to the tab (Supabase auto-refreshes tokens on visibility change). Our handler still calls `convertToAuthUser()` for every event, which makes 2 DB queries and logs "Auth state changed" / "Converting user to AuthUser" each time — even though the guard ultimately prevents a state update.

Additionally, `DashboardCards` and `OrderTable` both depend on the `user` object reference in their `useEffect` dependency arrays. If `user` reference ever changes (even briefly), both components re-fetch all 690 orders.

### Changes

**1. `src/context/AuthContext.tsx`** — Skip `TOKEN_REFRESHED` and `INITIAL_SESSION` events entirely in `onAuthStateChange`. Only process `SIGNED_IN` and `SIGNED_OUT`. This eliminates the unnecessary `convertToAuthUser` calls (and their 2 DB queries) on every tab return:

```tsx
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  if (!mounted) return;

  // Only react to actual sign-in/sign-out, not token refreshes
  if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

  if (event === 'SIGNED_OUT') {
    setUser(null);
    setIsLoading(false);
    return;
  }

  if (session?.user) {
    setTimeout(async () => {
      // ... existing convertToAuthUser + guard logic
    }, 0);
  }
});
```

**2. `src/components/dashboard/DashboardCards.tsx`** — Replace `user` with `user?.id` in the useEffect dependency array (line 164). Object identity shouldn't trigger re-fetches, only user change should:

```tsx
}, [isAdmin, user?.id, isYearlyPackages, statusFilter]);
```

**3. `src/components/dashboard/OrderTable.tsx`** — Replace `user` with `user?.id` in the `fetchOrders` useCallback dependency (line 106):

```tsx
}, [statusFilter, isYearlyPackages, toast, user?.id, isAdmin]);
```

These three changes ensure: (a) token refreshes on tab return are completely ignored, (b) dashboard components only re-fetch when the actual user changes, not when the user object reference changes.

