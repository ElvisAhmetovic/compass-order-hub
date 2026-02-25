

## Fix: App Becomes Unresponsive After ~20 Minutes Idle in Background Tab

### What's happening

When a browser tab is in the background for an extended period, two things break:

1. **Supabase Realtime channels disconnect** — The WebSocket connections used for real-time notifications, support badges, and ticket counts silently drop. When the user returns, clicks that depend on fresh data or realtime subscriptions fail.
2. **React Query stale data** — The QueryClient has no `refetchOnWindowFocus` configuration, so cached data stays stale and queries don't re-run when the tab regains focus.
3. **Auth token may expire silently** — While `autoRefreshToken` is enabled, the refresh timer can be suspended in background tabs, causing the next Supabase request to fail with an expired token.

### Changes

**1. `src/App.tsx`** — Configure the QueryClient with sensible defaults:
- `refetchOnWindowFocus: true` (actually already the default, but we should set `staleTime` to something reasonable)
- Keep queries fresh so they refetch when the user returns to the tab

**2. `src/context/AuthContext.tsx`** — Add a `visibilitychange` event listener:
- When the tab becomes visible again, call `supabase.auth.getSession()` to force a token refresh
- If the session is still valid, the app continues seamlessly; if not, the user gets redirected to login
- This ensures the auth token is always fresh when the user returns

**3. `src/components/layout/RealtimeRefresh.tsx`** (new component) — Add a global component that:
- Listens for the `visibilitychange` event
- When the document becomes visible after being hidden, removes and re-subscribes all Supabase realtime channels
- This is a lightweight approach — it just triggers a global event that individual components can listen to for reconnection

Actually, a simpler and more robust approach: just add a single visibility handler in `AuthContext` that refreshes the session, and configure QueryClient to refetch on window focus. The realtime channels in the Sidebar already re-subscribe on mount, so triggering a small state update will handle that.

### Final plan (3 changes):

**1. `src/App.tsx`** (line 63) — Update QueryClient config:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
```

**2. `src/context/AuthContext.tsx`** — Add a `visibilitychange` listener inside the existing `useEffect` (around line 120) that refreshes the Supabase session when the tab regains focus after being hidden. This forces a token refresh and ensures all subsequent API calls work:
```typescript
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const authUser = await convertToAuthUser(session.user);
      setUser(authUser);
    }
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
```

**3. `src/components/dashboard/Sidebar.tsx`** — Add a `visibilitychange` listener that re-fetches the unread support count and open ticket count when the tab becomes visible again, ensuring badges are up to date.

These three changes together ensure that when your boss comes back to the tab after 20+ minutes, the auth token is refreshed, queries re-fetch, and sidebar badges update — no manual refresh needed.

