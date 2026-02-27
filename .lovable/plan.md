

## Two Changes

### 1. Move "Upsell" in sidebar to right after "Work Hours"

**`src/components/dashboard/Sidebar.tsx`** — Move the Upsell entry (currently line 139) to line 130, right after Work Hours (line 128) and before User Management (line 129).

New order:
```
Dashboard
Work Hours
Upsell          ← moved here
User Management
Support
...
```

### 2. Fix modal-closes-on-tab-switch across all dialogs

Add `onFocusOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}` to every `DialogContent` that doesn't already have it. Files to update:

1. `src/components/dashboard/CreateOrderModal.tsx`
2. `src/components/dashboard/CreateYearlyPackageModal.tsx`
3. `src/components/dashboard/StatusChangeDialog.tsx`
4. `src/components/dashboard/PaymentRemindersListModal.tsx`
5. `src/components/tech-support/CreateTechSupportModal.tsx`
6. `src/components/tech-support/CreateTechSupportWithImageModal.tsx`
7. `src/components/clients/CreateClientDialog.tsx`
8. `src/components/clients/EditClientDialog.tsx`
9. `src/components/companies/CreateCompanyDialog.tsx`
10. `src/components/companies/EditCompanyDialog.tsx`
11. `src/components/user-management/AddUserModal.tsx`
12. `src/components/user-management/EditUserModal.tsx`
13. `src/components/user-management/AssignOrdersModal.tsx`
14. `src/components/invoices/SendInvoiceDialog.tsx`
15. `src/components/invoices/SendInvoicePDFDialog.tsx`
16. `src/components/orders/SendClientReminderModal.tsx`
17. `src/components/orders/ScheduleReminderModal.tsx`
18. `src/components/inventory/ImportDialog.tsx`

Same one-line pattern on each `<DialogContent>`:
```tsx
<DialogContent
  onFocusOutside={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
  // ... existing className and other props preserved
>
```

