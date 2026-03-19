

## Fix: Add Sidebar + Verify Reminders List on Reminders Page

### Problem
The Reminders page uses only `<Layout>` without the `<Sidebar>` component, unlike every other admin page (Dashboard, etc.) which wraps content in `<div className="flex min-h-screen"><Sidebar />...</div>`.

### Changes

**`src/pages/Reminders.tsx`**
- Import `Sidebar` from `@/components/dashboard/Sidebar`
- Wrap the return in the standard layout pattern:
```tsx
return (
  <div className="flex min-h-screen">
    <Sidebar />
    <Layout>
      {/* existing page content unchanged */}
    </Layout>
  </div>
);
```

This matches the Dashboard pattern exactly and will restore the sidebar navigation. The reminder list (scheduled + past sections) is already coded and should display once the layout renders correctly.

