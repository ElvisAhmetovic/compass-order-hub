

## Reorder Sidebar Menu Items

Move "Invoice Sent", "Invoice Paid", "Invoices", and "Proposals" to appear directly after "Active Orders" in the sidebar.

### Change

**`src/components/dashboard/Sidebar.tsx`** — Reorder the `menuItems` array:

Current order (relevant section):
```
Active Orders
Yearly Packages
Facebook
Google Deletion
Complaints
Completed
Cancelled
Reviews
Invoice Sent
Invoice Paid
Companies
Proposals
Invoices
Clients
...
```

New order:
```
Active Orders
Invoice Sent
Invoice Paid
Invoices
Proposals
Yearly Packages
Facebook
Google Deletion
Complaints
Completed
Cancelled
Reviews
Companies
Clients
...
```

Single file change — reordering items within the `menuItems` array.

