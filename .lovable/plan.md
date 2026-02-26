

## Stop the Tab-Switch Refresh (For Real This Time)

### Root Cause

The `visibilitychange` handler (line 199) calls `supabase.auth.getSession()` every time you return to the tab. This triggers `onAuthStateChange` (line 166) with a `SIGNED_IN` event, which **unconditionally** calls `setUser()` at line 178 — no ID comparison. That `setUser` causes the entire app to re-render, re-fetching all 690 orders.

The ID check we added at line 205 is irrelevant because the damage is done through the `onAuthStateChange` listener, not the visibility handler itself.

### Fix

**`src/context/AuthContext.tsx`**:

1. **Remove the `visibilitychange` listener entirely** (lines 198-219). Supabase's JS client already handles token refresh automatically — there's no need to manually call `getSession()` on tab focus.

2. **Add an ID check to `onAuthStateChange`** (line 171-188) so it doesn't call `setUser` when the same user is already loaded:

```tsx
if (session?.user) {
  setTimeout(async () => {
    try {
      const authUser = await convertToAuthUser(session.user);
      if (mounted) {
        setUser(prev => {
          if (prev && prev.id === authUser.id && prev.role === authUser.role) return prev;
          return authUser;
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error converting user in auth state change:', error);
      if (mounted) {
        setUser(null);
        setIsLoading(false);
      }
    }
  }, 0);
}
```

This eliminates both the unnecessary `getSession()` call and the unconditional `setUser()` that was causing the full re-render cascade.

