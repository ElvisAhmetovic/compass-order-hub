

# Production-Ready Fixes and QA Test Script Implementation

## Overview
This plan addresses all critical production issues identified in the Client Portal implementation and includes a comprehensive QA test script to verify everything works correctly.

---

## Part 1: Production Fixes

### Fix 1: Real Email Invite System (Edge Function)

**Current State**: The "Send Login Invite" button in `ClientAccessSection.tsx` only shows a toast and logs to `order_audit_logs`. No actual email is sent.

**Solution**: Create a new Edge Function `send-client-invite` that sends a real email to the client with their portal access information.

**New File: `supabase/functions/send-client-invite/index.ts`**

The Edge Function will:
1. Accept `clientEmail`, `clientName`, `orderId`, `companyName`, `senderName` as parameters
2. Use the existing `RESEND_API_KEY_ABMEDIA` secret (already configured)
3. Send from `ThomasKlein@abm-team.com` (following existing pattern from `send-client-payment-reminder`)
4. Generate a professional HTML email with:
   - Welcome message
   - Login URL: `https://www.empriadental.de/client/login`
   - Brief instructions on accessing their orders
5. Log the invite to `order_audit_logs`

**Update: `src/services/clientAccessService.ts`**
- Replace `logInviteSent()` with `sendClientInvite()` that calls the Edge Function
- Handle success/error responses appropriately

**Update: `src/components/dashboard/ClientAccessSection.tsx`**
- Update `handleSendInvite()` to call the new service function
- Show appropriate success/error toasts based on Edge Function response

---

### Fix 2: Confirmation Dialog for Remove Access

**Current State**: The "Remove Access" button immediately removes the client without confirmation, risking accidental clicks.

**Solution**: Add an AlertDialog confirmation before unlinking.

**Update: `src/components/dashboard/ClientAccessSection.tsx`**

Add confirmation dialog with:
- Title: "Remove Client Access?"
- Description: "This will revoke [Client Name]'s access to this order. They will no longer be able to view this order in their portal."
- Cancel and Confirm buttons
- Only proceed with `unlinkClientFromOrder()` if confirmed

---

### Fix 3: Client Support System

**Current State**: `ClientSupport.tsx` is a placeholder with "Coming Soon" message.

**Solution**: Create a functional support inquiry system for clients using the existing `support_inquiries` and `support_replies` tables.

#### 3.1 Database Migration

Add `order_id` column to `support_inquiries` to link support tickets to specific orders:

```sql
-- Add order_id to support_inquiries for order-specific support
ALTER TABLE public.support_inquiries
ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Update RLS policy to allow clients to view/create their own inquiries
CREATE POLICY "Clients can view their own inquiries"
  ON public.support_inquiries
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Clients can create inquiries"
  ON public.support_inquiries
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow clients to view replies to their inquiries
CREATE POLICY "Clients can view replies to their inquiries"
  ON public.support_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_inquiries si
      WHERE si.id = support_replies.inquiry_id
        AND si.user_id = auth.uid()
    )
  );
```

#### 3.2 New Service: `src/services/clientSupportService.ts`

Functions needed:
- `fetchClientInquiries()`: Get all support tickets for the logged-in client
- `fetchClientInquiryById(id)`: Get a specific ticket with replies
- `createClientInquiry({ subject, message, orderId? })`: Create new support ticket
- `addClientReply(inquiryId, message)`: Add a reply to an existing ticket

#### 3.3 Update: `src/pages/client/ClientSupport.tsx`

Complete redesign with:
- List of client's support inquiries with status badges (Open, In Progress, Closed)
- "New Inquiry" button that opens a form
- Option to link inquiry to a specific order (dropdown of client's orders)

#### 3.4 New Page: `src/pages/client/ClientSupportDetail.tsx`

Ticket detail view with:
- Original inquiry details
- Thread of replies (from client and support team)
- Reply form at the bottom
- Status indicator

#### 3.5 Update: `src/App.tsx`

Add route: `/client/support/:ticketId` for the detail page

---

### Fix 4: Client Search/Filter in Admin Dropdown

**Current State**: If there are many client users, the Select dropdown becomes unwieldy.

**Solution**: Replace the basic Select with a Combobox that supports search filtering.

**Update: `src/components/dashboard/ClientAccessSection.tsx`**

Replace `Select` with `Popover` + `Command` pattern (combobox):
- Search input to filter clients by name or email
- Scrollable list of matching clients
- Same selection behavior as before

---

### Fix 5: Enhanced Audit Logging

**Current State**: Audit logs record actions but lack detail about which client was linked/unlinked.

**Solution**: Include client details in audit log entries.

**Update: `src/services/clientAccessService.ts`**

Enhance `linkClientToOrder()`:
```typescript
details: `Client "${clientName}" (${clientEmail}) linked to order`
```

Enhance `unlinkClientFromOrder()`:
```typescript
// Fetch current client before unlinking
details: `Client "${clientName}" (${clientEmail}) access revoked`
```

---

## Part 2: Comprehensive QA Test Script

After implementing the fixes, the following test cases should be verified:

### Authentication & Role-Based Access Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-01 | Client login redirects correctly | 1. Log in with client credentials at /login | Redirect to /client/dashboard |
| AUTH-02 | Admin login redirects correctly | 1. Log in with admin credentials at /login | Redirect to /dashboard |
| AUTH-03 | Client cannot access admin routes | 1. As client, navigate to /dashboard directly | Redirect to /client/dashboard |
| AUTH-04 | Admin can access admin routes | 1. As admin, navigate to /dashboard | Access granted, dashboard loads |
| AUTH-05 | Unauthenticated redirect | 1. Visit /client/dashboard without logging in | Redirect to /client/login |

### Client Portal Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CLIENT-01 | Dashboard loads stats | 1. Log in as client 2. View dashboard | Stats cards show correct counts |
| CLIENT-02 | Recent orders display | 1. View dashboard | Up to 5 recent orders with progress bars |
| CLIENT-03 | View all orders | 1. Click "View All" or go to /client/orders | Full order list displayed |
| CLIENT-04 | Order detail view | 1. Click on an order | Order details, progress bar, attachments shown |
| CLIENT-05 | Profile update | 1. Go to /client/profile 2. Update name 3. Save | Name updated successfully |
| CLIENT-06 | Password change | 1. Go to /client/profile 2. Enter new password 3. Submit | Password changed, can re-login |
| CLIENT-07 | Client sees only their orders | 1. Check orders list | Only orders with client_id matching user shown |

### Client Support Tests (New Feature)

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SUPPORT-01 | View support page | 1. Navigate to /client/support | List of inquiries or empty state |
| SUPPORT-02 | Create new inquiry | 1. Click New Inquiry 2. Fill form 3. Submit | Inquiry created, appears in list |
| SUPPORT-03 | Link inquiry to order | 1. Create inquiry 2. Select order from dropdown | Inquiry shows linked order |
| SUPPORT-04 | View inquiry detail | 1. Click on inquiry | Detail page with replies thread |
| SUPPORT-05 | Add reply to inquiry | 1. Open inquiry 2. Type reply 3. Submit | Reply appears in thread |

### Admin Client Access Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ADMIN-01 | Client Access section visible | 1. As admin, open order modal | Client Access section visible |
| ADMIN-02 | Non-admin cannot see section | 1. As agent/user, open order modal | Client Access section NOT visible |
| ADMIN-03 | Link client to order | 1. Select client from dropdown 2. Click Link | Client linked, order updated |
| ADMIN-04 | Send invite email | 1. With client linked, click Send Login Invite | Email sent, success toast |
| ADMIN-05 | Remove access confirmation | 1. Click Remove Access | Confirmation dialog appears |
| ADMIN-06 | Confirm remove access | 1. Click Remove Access 2. Confirm | Client unlinked, access revoked |
| ADMIN-07 | Search clients in dropdown | 1. Click client dropdown 2. Type search term | Filtered list shows matching clients |

### Security & RLS Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEC-01 | Client cannot see other client's orders | 1. As Client A, try to access Client B's order via URL | 404 or access denied |
| SEC-02 | Client cannot modify orders | 1. Attempt direct Supabase update on order | RLS blocks operation |
| SEC-03 | Client cannot delete orders | 1. Attempt direct Supabase delete on order | RLS blocks operation |
| SEC-04 | Audit logs capture all actions | 1. Link/unlink clients 2. Check order_audit_logs | All actions logged with details |
| SEC-05 | Attachments access control | 1. As client, view order attachments | Only see attachments for own orders |

### Edge Cases Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| EDGE-01 | No orders assigned | 1. Log in as client with no orders | Dashboard shows empty state gracefully |
| EDGE-02 | Order with no attachments | 1. View order without attachments | Attachments section shows "No files" |
| EDGE-03 | Invalid order ID access | 1. Navigate to /client/orders/invalid-uuid | Error handled, redirect or 404 |
| EDGE-04 | Session timeout handling | 1. Let session expire 2. Try action | Redirect to login |
| EDGE-05 | Rapid button clicks | 1. Click Link/Unlink rapidly | Only one operation processed, no duplicates |

---

## Implementation Summary

| Component | Change Type | Priority | Description |
|-----------|-------------|----------|-------------|
| send-client-invite Edge Function | Create | High | Real email sending for client invites |
| ClientAccessSection.tsx | Modify | High | Confirmation dialog, search dropdown, real email integration |
| clientAccessService.ts | Modify | High | Enhanced audit logs, email sending |
| support_inquiries migration | Create | Medium | Add order_id column and RLS policies |
| clientSupportService.ts | Create | Medium | Support ticket service for clients |
| ClientSupport.tsx | Rewrite | Medium | Full support system UI |
| ClientSupportDetail.tsx | Create | Medium | Support ticket detail view |
| App.tsx | Modify | Medium | Add support detail route |

---

## Files to Create

1. `supabase/functions/send-client-invite/index.ts` - Email sending Edge Function
2. `src/services/clientSupportService.ts` - Client support service
3. `src/pages/client/ClientSupportDetail.tsx` - Support ticket detail page

## Files to Modify

1. `src/components/dashboard/ClientAccessSection.tsx` - Add confirmation, search, email
2. `src/services/clientAccessService.ts` - Enhanced logging and email integration
3. `src/pages/client/ClientSupport.tsx` - Full support system
4. `src/App.tsx` - Add support detail route
5. Database migration for `support_inquiries`

## Secrets Already Configured

All required secrets exist:
- `RESEND_API_KEY_ABMEDIA` - For sending emails from abm-team.com domain
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - For database operations in Edge Functions
- `APP_URL` - For generating portal links (https://www.empriadental.de)

