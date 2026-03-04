

## Smart Client Portal Account Creation + Linking

### Overview
Add a streamlined flow to create/link client portal accounts directly from order rows, with duplicate detection, credential email delivery, and visual portal status indicators.

### New Files

**1. `src/components/dashboard/CreateClientPortalModal.tsx`**
Modal component with smart pre-filling:
- Props: `open`, `onOpenChange`, `order` (Order object), `onSuccess` callback
- On open: auto-fill name from `order.contact_name || order.company_name`, email from `order.contact_email`
- Auto-generate 16-char secure password (uppercase, lowercase, numbers, symbols), displayed with copy button
- Auto-set role = "client" (hidden, not editable)
- **Duplicate check**: on mount/email change, query `app_users` table for matching email
  - If found: show info banner "Client portal already exists for this email" + "Link to this order" button
  - If not found: show creation form with "Create & Send Invite" button
- On create: call `create-user` edge function (already exists), then link order via `linkClientToOrder`, then send invite via new `send-client-portal-credentials` edge function
- On link-existing: call `linkClientToOrder` directly, show success
- Option to "Re-send credentials" for existing accounts (generates new password via edge function)

**2. `supabase/functions/send-client-portal-credentials/index.ts`**
New edge function that:
- Accepts: `clientEmail`, `clientName`, `password`, `portalUrl`, `companyName`, `senderName`, `senderId`, `orderId`
- Sends branded HTML email to client with login URL, email, and password
- Sends BCC/copy to team emails from `NOTIFICATION_EMAIL_LIST` (batched, 2 per batch, 1s delay to avoid Resend rate limits)
- Logs action to `order_audit_logs`
- Uses `RESEND_API_KEY_ABMEDIA` for sending

### Modified Files

**3. `src/components/dashboard/OrderRow.tsx`**
- Add portal status indicator: small icon in the Company cell
  - Green `UserCheck` icon + tooltip "Client portal active" when `order.client_id` is set
  - Gray `UserX` icon + tooltip "No client portal" when `order.client_id` is null
- Add "Portal" button in the actions column (between "To Client" and "Invoice" buttons)
  - If no `client_id`: shows `KeyRound` icon + "Portal" label, opens `CreateClientPortalModal`
  - If `client_id` exists: shows green-tinted button, still opens modal (for re-send/view info)

**4. `src/components/dashboard/OrderTable.tsx`**
- Add "Portal" column header between Status and Updated columns

**5. `src/components/monthly/MonthlyInstallmentsTable.tsx`**
- Add portal status badge per contract row (green check vs gray X based on whether a client portal exists for the contract's `client_email`)
- Add "Create Portal" action button per contract row

**6. `supabase/functions/create-user/index.ts`**
- Add optional `linkOrderId` parameter: if provided, automatically link the created user to that order by updating `orders.client_id`
- Return the created `user_id` in response (already does this)

**7. `supabase/config.toml`**
- Add `[functions.send-client-portal-credentials]` with `verify_jwt = false`

### Security
- All user creation goes through the existing `create-user` edge function (admin-only, server-side validation)
- Password generation happens client-side but is at least 12 chars with mixed case + numbers + symbols
- Duplicate detection uses server-side email lookup
- All actions logged to `order_audit_logs`

### Password Generation
```typescript
function generateSecurePassword(length = 14): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + numbers + symbols;
  // Ensure at least one of each category, fill rest randomly
}
```

### Flow Summary
1. Admin clicks "Portal" button on order row
2. Modal opens with pre-filled name/email from order, generated password
3. System checks for existing account with same email
4. If exists → offer to link + optionally re-send credentials
5. If new → create account, link to order, send credentials email (to client + team copy)
6. Order table shows green/gray icon indicating portal status

