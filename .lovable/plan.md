

Move the "Yearly Packages" sidebar item to the bottom of the menu list, just before "Team Chat" (the current last item).

**File: `src/components/dashboard/Sidebar.tsx`**

- Move the `{ href: '/yearly-packages', ... }` entry from its current position (after Proposals) to just before the Team Chat entry at the bottom of the `menuItems` array.

