

# Enhanced Client Dashboard Implementation Plan

## Overview
This plan enhances the existing client portal at `/client/dashboard` with a more professional, progress-focused layout while adding role-based login redirects and order attachment support.

---

## Current State Analysis

### What Already Exists:
- **Client Portal Routes**: `/client/dashboard`, `/client/orders`, `/client/profile` ✅
- **ClientGuard**: Role-based protection for client routes ✅
- **ClientLogin**: Redirects clients to `/client/dashboard` and non-clients to `/dashboard` ✅
- **ClientDashboard**: Basic stats cards + company info ✅
- **ClientOrders**: Order list with status badges ✅
- **ClientOrderDetail**: Order details with progress steps ✅
- **ClientProfile**: Name + password update forms ✅

### What's Missing:
1. **Admin Login Redirect**: The main `/login` page always redirects to `/dashboard` regardless of role
2. **Order Attachments**: No direct order-file relationship exists in the database
3. **Recent Orders on Dashboard**: Dashboard only shows stats, not actual orders
4. **Progress Bars**: Order status shown as badges, not progress indicators
5. **Enhanced Profile Section**: Profile doesn't show company info for editing

---

## Implementation Plan

### Phase 1: Role-Based Login Redirects

**Goal**: When any user logs in, redirect them to the appropriate dashboard based on their role.

#### 1.1 Update LoginForm.tsx
Modify the success handler to check user role after login and redirect accordingly:

```text
Login Flow:
1. User submits credentials
2. Login succeeds → fetch user role from context
3. If role === 'client' → redirect to /client/dashboard
4. If role === 'admin' | 'agent' | 'user' → redirect to /dashboard
```

**Files to modify:**
- `src/components/auth/LoginForm.tsx` - Add role-based redirect logic

#### 1.2 Update RequireAuth Component
Ensure the `RequireAuth` component also handles role-based redirection for users trying to access admin routes:

**Files to modify:**
- `src/components/auth/RequireAuth.tsx` - Redirect clients away from admin routes

---

### Phase 2: Order Attachments Support

**Goal**: Allow files to be attached to orders and displayed to clients.

#### 2.1 Database Migration
Add `order_id` column to `file_attachments` table to enable order-file linking:

```sql
-- Add order_id to file_attachments for order attachments
ALTER TABLE public.file_attachments
ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX idx_file_attachments_order_id ON public.file_attachments(order_id);

-- RLS Policy: Allow clients to view attachments for their orders
CREATE POLICY "Clients can view their order attachments"
  ON public.file_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = file_attachments.order_id
        AND (o.client_id = auth.uid() OR 
             EXISTS (
               SELECT 1 FROM public.companies c 
               WHERE c.id = o.company_id AND c.client_user_id = auth.uid()
             ))
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'user')
  );
```

#### 2.2 Create Order Attachments Service
New service function to fetch attachments for an order:

**Files to create:**
- Add function `getOrderAttachments(orderId: string)` to `src/services/clientOrderService.ts`

---

### Phase 3: Enhanced Client Dashboard UI

**Goal**: Create a professional, progress-focused dashboard showing recent orders with progress bars.

#### 3.1 Update ClientDashboard Layout

**New Dashboard Structure:**
```text
┌─────────────────────────────────────────────────────────────┐
│  Welcome, [Client Name]!                                    │
│  Quick overview of your orders and projects                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Total   │ │ Active  │ │ Invoice │ │ Compl.  │           │
│  │ Orders  │ │ Orders  │ │ Pending │ │  Jobs   │           │
│  │   12    │ │    4    │ │    2    │ │    6    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Recent Orders                                     View All →│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Project: Company ABC                                     ││
│  │ Created: Jan 15, 2026                                    ││
│  │ Progress: ████████████░░░░░░░░ 60%                      ││
│  │ Status: In Progress → Invoice Sent                       ││
│  │ Attachments: 📎 2 files                                  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ...more orders...                                        ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Quick Profile                              Edit Profile →  │
│  Name: John Doe                                             │
│  Email: john@company.com                                    │
│  Company: Company ABC                                       │
└─────────────────────────────────────────────────────────────┘
```

**Files to modify:**
- `src/pages/client/ClientDashboard.tsx` - Complete redesign

#### 3.2 Create ClientOrderCard Component
Reusable card showing order with progress bar and attachments:

**Progress Bar Logic:**
```text
Status Weight:
- Created: 10%
- In Progress: 40%
- Invoice Sent: 60%
- Invoice Paid: 80%
- Resolved: 100%
- Cancelled: Shows "Cancelled" badge instead of progress
```

**Files to create:**
- `src/components/client-portal/ClientOrderCard.tsx`

#### 3.3 Update ClientOrderDetail
Add attachments section to order detail page:

**Files to modify:**
- `src/pages/client/ClientOrderDetail.tsx` - Add attachments viewer

---

### Phase 4: Enhanced Profile Section on Dashboard

**Goal**: Show a quick profile summary with link to full edit page.

#### 4.1 Update ClientDashboard
Add a "Quick Profile" card showing:
- Client name
- Email
- Linked company name
- "Edit Profile" button

**Already covered in Phase 3.1**

---

## Technical Details

### Files to Create:
1. `src/components/client-portal/ClientOrderCard.tsx` - Order card with progress bar

### Files to Modify:
1. `src/components/auth/LoginForm.tsx` - Role-based redirect
2. `src/components/auth/RequireAuth.tsx` - Redirect clients from admin routes
3. `src/pages/client/ClientDashboard.tsx` - Enhanced layout with recent orders
4. `src/pages/client/ClientOrderDetail.tsx` - Add attachments section
5. `src/services/clientOrderService.ts` - Add getOrderAttachments function

### Database Migration:
1. Add `order_id` column to `file_attachments` table
2. Add RLS policy for client attachment access

---

## Component Architecture

```text
ClientDashboard.tsx
├── Stats Cards (4x)
│   └── Card component with icon + value
├── Recent Orders Section
│   └── ClientOrderCard.tsx (up to 5 recent orders)
│       ├── Order name/company
│       ├── Date created
│       ├── Progress bar (using Progress component)
│       ├── Status text
│       └── Attachments count with icon
└── Quick Profile Card
    ├── Name, Email, Company
    └── Edit Profile button → links to /client/profile

ClientOrderDetail.tsx
├── Order info (existing)
├── Progress steps (existing)
├── Contact info (existing)
└── Attachments section (NEW)
    └── File list with download links
```

---

## Security Considerations

1. **RLS on file_attachments**: Clients can ONLY view attachments for their own orders
2. **RequireAuth Update**: Clients cannot access admin routes even if they type the URL manually
3. **Attachment Access**: Use signed URLs (same pattern as ticket-attachments) with expiration

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| LoginForm.tsx | Modify | Add role-based redirect after login |
| RequireAuth.tsx | Modify | Redirect clients to /client/dashboard |
| ClientDashboard.tsx | Rewrite | Enhanced UI with orders + profile |
| ClientOrderCard.tsx | Create | New component with progress bar |
| ClientOrderDetail.tsx | Modify | Add attachments section |
| clientOrderService.ts | Modify | Add getOrderAttachments function |
| Database | Migration | Add order_id to file_attachments |

---

## Dependencies

Uses existing components:
- `Progress` from `@/components/ui/progress`
- `Card` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`
- `Button` from `@/components/ui/button`

No new npm packages required.

