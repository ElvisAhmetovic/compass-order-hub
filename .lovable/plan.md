

## Disable Auto-Refresh on Tab Switch

### Change

**`src/App.tsx`** — Set `refetchOnWindowFocus` to `false` in the QueryClient config (line 67):

```tsx
refetchOnWindowFocus: false,
```

This stops React Query from automatically refetching all queries when the user switches back to the tab. The pointer-event fix stays — only the data refetching behavior changes.

