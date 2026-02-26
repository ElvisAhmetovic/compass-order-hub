

## Stop Full App Re-render on Tab Switch

### Root Cause
The `refetchOnWindowFocus: false` fix only stopped React Query. But three other `visibilitychange` listeners are still triggering data refreshes:

1. **`src/context/AuthContext.tsx` (line 199-213)** — Calls `setUser()` on every tab return, even when nothing changed. This triggers a full re-render cascade, causing DashboardCards and OrderTable `useEffect` hooks to re-fetch all 690 orders.
2. **`src/components/dashboard/Sidebar.tsx` (lines 93, 127)** — Re-fetches support counts and ticket badges on every tab return.

### Changes

**1. `src/context/AuthContext.tsx` (lines 199-213)** — Only call `setUser()` if the user ID actually changed. Compare the refreshed session user ID against the current user state before updating:

```tsx
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible' && mounted) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        // Only update state if user actually changed (avoid re-render cascade)
        setUser(prev => {
          if (prev?.id === session.user.id) return prev;
          // User changed — convert and update
          convertToAuthUser(session.user).then(authUser => {
            if (mounted) setUser(authUser);
          });
          return prev;
        });
      } else if (!session && mounted) {
        setUser(prev => prev === null ? prev : null);
      }
    } catch (error) {
      console.error('Error refreshing session on visibility change:', error);
    }
  }
};
```

**2. `src/components/dashboard/Sidebar.tsx`** — Remove the two `visibilitychange` listeners (lines 93-95 and 127-129). The support counts and ticket badges will update via their existing realtime subscriptions and don't need to re-fetch on every tab switch.

