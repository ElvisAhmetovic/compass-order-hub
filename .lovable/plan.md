

# Add "Create Order" Button to Every Sidebar Page

## Approach

Instead of duplicating `CreateOrderModal` across 20+ pages, we'll embed it directly in the **Sidebar component** itself. This way, every page that uses the Sidebar automatically gets access to the "Create Order" button -- zero changes needed to individual pages.

## What changes

### Sidebar (`src/components/dashboard/Sidebar.tsx`)
- Add a "Create Order" button (with the Plus icon) near the top of the sidebar, below the "Navigation" heading
- Only visible for admin users (same permission check as today)
- Import and render `CreateOrderModal` inside the Sidebar
- Manage open/close state locally within the Sidebar

### Pages that already have their own Create Order button
These pages already have their own `DashboardHeader` with `onCreateOrder` and their own `CreateOrderModal`:
- Dashboard, Facebook, Instagram, Trustpilot, TrustpilotDeletion, GoogleDeletion, YearlyPackages

We'll **keep those as-is** so nothing breaks. The sidebar button is simply an additional access point that works everywhere, including pages like Analytics, Rankings, Companies, Proposals, Invoices, Support, Settings, etc.

## Visual placement

```text
+---------------------------+
|  Navigation               |
|  [+ Create Order] (button)|
|                           |
|  Dashboard                |
|  Analytics                |
|  Rankings                 |
|  ...                      |
+---------------------------+
```

The button will be styled as a primary button, matching the existing "Create Order" button style, placed in the sidebar header area so it's always visible and easy to reach.

## Technical details

- Import `CreateOrderModal` and `useState` into `Sidebar.tsx`
- Add a `createModalOpen` state
- Render a `Button` with `Plus` icon, gated by `isAdmin`
- Render `CreateOrderModal` with `open={createModalOpen}` and `onClose` that sets it to false
- The modal functions identically to the existing one (same component, same behavior)

## Files to modify
| File | Change |
|------|--------|
| `src/components/dashboard/Sidebar.tsx` | Add Create Order button + CreateOrderModal |

One file, minimal change, works on every page.

