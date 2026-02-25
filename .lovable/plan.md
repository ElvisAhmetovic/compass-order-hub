

## Hide Unused Sidebar Items

Remove Instagram, Trustpilot, and Trustpilot Deletion from the sidebar navigation in `src/components/dashboard/Sidebar.tsx`.

### Change

Delete these three entries from the `menuItems` array:

```
{ href: '/instagram', icon: Instagram, label: 'Instagram', ... }
{ href: '/trustpilot', icon: Star, label: 'Trustpilot', ... }
{ href: '/trustpilot-deletion', icon: UserX, label: 'Trustpilot Deletion', ... }
```

No other files need changes — the routes/pages remain in the codebase but just won't be linked from the sidebar.

