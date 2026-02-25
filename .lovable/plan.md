

## Reorder Sidebar Navigation Items

### What
Move **Work Hours** and **User Management** up near the top (right after Dashboard), and move **Analytics** and **User Statistics** down toward the bottom of the sidebar.

### Change

**`src/components/dashboard/Sidebar.tsx`** — Reorder the `menuItems` array:

```
Dashboard
Work Hours           ← moved up
User Management      ← moved up
Support
Customer Tickets
Tech Support
My Orders / Active Orders
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
Inventory
Rankings
Analytics            ← moved down
User Statistics      ← moved down
Settings
Deleted
Team Chat
```

Single file change, just reordering entries in the array.

