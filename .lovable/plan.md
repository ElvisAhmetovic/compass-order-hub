

## Move Monthly Packages in Sidebar

In `src/components/dashboard/Sidebar.tsx`, move the `Monthly Packages` menu item from its current position (after Yearly Packages) up to directly below `Work Hours`, before `Text`.

### Change

| File | Change |
|------|--------|
| `src/components/dashboard/Sidebar.tsx` | Reorder the `menuItems` array: move the Monthly Packages entry (`/monthly-packages`) to index 2 (after Work Hours, before Text) |

