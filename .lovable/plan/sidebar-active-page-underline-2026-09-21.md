# Sidebar Active-Page Underline

## Goal
Make the current page obvious in the sidebar by adding a styled underline beneath the active nav item's label text, matching the Navy Trust design system.

## What we will change

1. **Active-item underline in `src/components/dashboard/Sidebar.tsx`**
   - Add a visible line under the label text of whichever page is active.
   - Keep the existing active background tint and right-border accent, but make the underline the primary "you are here" signal.
   - Use `text-sidebar-primary` / `bg-sidebar-primary` tokens so it adapts to light and dark modes.

2. **Apply to all sidebar sections**
   - Main nav items (`Dashboard`, `Work Hours`, `Invoices`, etc.).
   - Collapsed "More..." items when expanded.
   - Social Media submenu items (`Facebook`, `ABM Website`, etc.).
   - Locked/restricted items should not show the active underline.

3. **Visual details**
   - Underline sits directly under the label text, not the whole row.
   - Width matches the text width (inline layout).
   - Subtle rounded caps and a short transition on hover/active change.
   - Color: `bg-sidebar-primary` so it ties to the existing accent.

4. **No behavior changes**
   - Active-state detection logic stays the same.
   - Navigation, badges, counts, role filtering, and locked items are untouched.

## Acceptance
- The active page in the sidebar shows a clear underline under its label.
- Light mode and dark mode both look consistent with the Navy Trust palette.
- Submenu/collapsed items also show the underline when active.
- No console errors or layout shifts.
