

## Add Sidebar to Customer Tickets Pages

Both `CustomerTickets.tsx` and `CustomerTicketDetail.tsx` use only `<Layout>` without the dashboard `<Sidebar />`, making them inconsistent with other admin pages.

### Fix
Wrap both pages with the same sidebar pattern used in `Support.tsx`:

```tsx
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex-1">
    <Layout>
      {/* existing content */}
    </Layout>
  </div>
</div>
```

### Files
- `src/pages/CustomerTickets.tsx` — import `Sidebar`, wrap return with sidebar layout, remove the "Back to Dashboard" button (sidebar handles navigation)
- `src/pages/CustomerTicketDetail.tsx` — same sidebar wrapper treatment

