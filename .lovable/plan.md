

## Fix: Inconsistent Sidebar/Content Sizing Across Pages

### Problem
Some pages use `<div className="flex-1 flex">` around the Layout component (Dashboard, Offers), while others use just `<div className="flex-1">`. Since `Layout` has `className="flex-1 min-w-0"`, it needs a flex parent to stretch properly. Without `flex`, the content area renders at a slightly different width, making the sidebar appear to shift between pages.

### Fix
Add `flex` to the inner wrapper div on every page that's missing it. The correct pattern is:
```html
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex-1 flex">   <!-- needs "flex" here -->
    <Layout>...</Layout>
  </div>
</div>
```

### Pages to update (change `"flex-1"` → `"flex-1 flex"`)
1. `src/pages/Invoices.tsx`
2. `src/pages/Clients.tsx`
3. `src/pages/Companies.tsx`
4. `src/pages/Inventory.tsx`
5. `src/pages/Rankings.tsx`
6. `src/pages/Analytics.tsx`
7. `src/pages/Support.tsx`
8. `src/pages/SupportDetail.tsx`
9. `src/pages/MonthlyPackages.tsx`
10. `src/pages/UserStatistics.tsx`
11. `src/pages/Settings.tsx`
12. `src/pages/Deleted.tsx`
13. `src/pages/Reviews.tsx`
14. `src/pages/Proposals.tsx`
15. `src/pages/ProposalDetail.tsx`
16. `src/pages/InvoiceDetail.tsx`
17. `src/pages/Reminders.tsx`
18. `src/pages/Profile.tsx`
19. `src/pages/WorkHours.tsx`
20. `src/pages/YearlyPackages.tsx`
21. `src/pages/UserManagement.tsx`
22. `src/pages/TechSupport.tsx`
23. `src/pages/TechSupportDetail.tsx`
24. `src/pages/EmailManagement.tsx`
25. `src/pages/TextLibrary.tsx`
26. `src/pages/TeamCollaboration.tsx`
27. `src/pages/NotificationSettings.tsx`
28. `src/pages/Facebook.tsx`
29. `src/pages/Instagram.tsx`
30. `src/pages/GoogleDeletion.tsx`
31. `src/pages/TrustpilotDeletion.tsx`
32. `src/pages/Trustpilot.tsx`
33. `src/pages/CustomerTickets.tsx`
34. `src/pages/CustomerTicketDetail.tsx`
35. `src/pages/Security.tsx`

Each file: find every instance of `<div className="flex-1">` (the sibling of `<Sidebar />`) and change it to `<div className="flex-1 flex">`. This is a one-line change per occurrence, applied consistently across all pages.

