

## Fix Sidebar Dark Mode

The sidebar (`src/components/dashboard/Sidebar.tsx`) has hardcoded white/light colors that don't adapt to dark mode.

### Changes to `src/components/dashboard/Sidebar.tsx`

**Line 172** — Container div:
- `bg-white border-r border-gray-200` → `bg-card border-r border-border`

**Line 187** — Empty state text:
- `text-gray-500` → `text-muted-foreground`

**Line 207** — Menu item default state:
- `text-gray-700 hover:bg-gray-50 hover:text-gray-900` → `text-foreground/70 hover:bg-accent hover:text-foreground`

**Line 208** — Active menu item:
- `bg-blue-50 text-blue-700 border-r-2 border-blue-700` → `bg-primary/10 text-primary border-r-2 border-primary`

These changes replace hardcoded gray/blue/white values with semantic Tailwind tokens (`bg-card`, `border-border`, `text-foreground`, `bg-accent`, `bg-primary/10`, `text-primary`) that automatically adapt to both light and dark themes.

