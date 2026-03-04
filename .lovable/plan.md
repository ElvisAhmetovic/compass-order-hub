

## Remove Facebook from Sidebar

Remove the Facebook menu item from the sidebar navigation in `src/components/dashboard/Sidebar.tsx`. The route and page component will remain in the codebase but won't be accessible from the sidebar (consistent with the existing pattern for Instagram/Trustpilot).

### Change
**`src/components/dashboard/Sidebar.tsx`** — Delete the Facebook entry from the `menuItems` array:
```
{ href: '/facebook', icon: Facebook, label: 'Facebook', roles: ['admin', 'agent'] }
```
Also remove the unused `Facebook` icon import from lucide-react.

