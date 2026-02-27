

## Add Sidebar to Upsell Page

The Upsell page currently only uses `<Layout>` without the `<Sidebar />`, unlike every other page in the app. The fix is to wrap the page content with the same `flex` layout pattern used everywhere else.

### Change

**`src/pages/Upsell.tsx`** — Wrap the return with the sidebar layout pattern:

```tsx
// Current:
return (
  <Layout>
    <div className="p-6 max-w-4xl mx-auto">
      ...
    </div>
  </Layout>
);

// Updated:
return (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1">
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          ...
        </div>
      </Layout>
    </div>
  </div>
);
```

Add `import Sidebar from '@/components/dashboard/Sidebar';` to imports.

