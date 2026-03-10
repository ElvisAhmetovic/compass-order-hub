

## Add Sidebar to Settings + Collapsible "More..." Section with Configurable Items

### Two parts to this feature:

**1. Fix Settings page layout** -- Add `Sidebar` to the Settings page, matching the same `flex min-h-screen` pattern used by Dashboard and other pages.

**2. "More..." collapsible section in Sidebar** -- Add a collapsible dropdown at the bottom of the sidebar nav. Users can configure which items are hidden into this section via the Settings page.

### How it works

- Sidebar items that are marked as "hidden" by the user get moved from the main nav list into a collapsible "More..." section at the bottom.
- The hidden item labels are stored in `localStorage` per user (key: `sidebar-hidden-items-{userId}`), so it persists across sessions without needing a database table.
- In the Settings page, a new "Sidebar Navigation" card lists all available sidebar items with checkboxes. Unchecking an item moves it into the "More..." dropdown.
- The "More..." section uses a simple chevron toggle (open/close), and renders the hidden items in the same style as the main nav. If an active route is inside "More...", the section auto-opens.

### Files

**Modified: `src/components/dashboard/Sidebar.tsx`**
- Add a `hiddenItems` state loaded from localStorage
- Split `visibleItems` into two lists: main items and "more" items (based on hiddenItems)
- Render main items as before, then a collapsible "More..." toggle + hidden items list at the bottom
- Auto-expand "More..." if the current route matches a hidden item

**Modified: `src/pages/Settings.tsx`**
- Add Sidebar to the layout (wrap with `flex min-h-screen` + `<Sidebar />`)
- Add a new "Sidebar Navigation" card with checkboxes for each menu item
- Toggling a checkbox updates localStorage and dispatches a custom event (`sidebar-config-changed`) so the Sidebar re-reads its config

**New: `src/hooks/useSidebarConfig.ts`**
- Shared hook to read/write the hidden items list from localStorage
- Listens for the `sidebar-config-changed` event to stay in sync between Settings page and Sidebar

