# Fix squished sidebar on Tech Support pages

## Problem
On `/tech-support` (and the ticket detail page) the sidebar gets squeezed, unlike every other page. Cause: both pages nest the `Sidebar` **inside** the `Layout` component. Every other page (Support, Reminders, etc.) uses the standard pattern: `Sidebar` outside `Layout`, both wrapped in `flex min-h-screen`.

## Changes (presentation only, no behavior changes)

### `src/pages/TechSupport.tsx`
Restructure all three render paths (loading state, main list) from:
```text
<Layout>
  <div class="flex min-h-screen">
    <Sidebar />
    <content />
  </div>
</Layout>
```
to the standard pattern:
```text
<div class="flex min-h-screen">
  <Sidebar />
  <Layout userRole={userRole}>
    <content />
  </Layout>
</div>
```

### `src/pages/TechSupportDetail.tsx`
Same restructure for its four render paths (loading, not-found, main detail).

## Verification
- Typecheck passes.
- Visual check: Tech Support list and detail pages show the full-width navy sidebar identical to other pages.
