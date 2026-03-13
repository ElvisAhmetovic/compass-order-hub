

## Full Security Audit: Client Portal & System Isolation

### CRITICAL VULNERABILITY FOUND

**1. Role Escalation via `updateUserProfile` (CRITICAL)**

In `src/context/AuthContext.tsx` line 257, the `updateUserProfile` method writes `role: profileData.role || user.role` directly to the `profiles` table. The `profiles` UPDATE RLS policy allows any user to update their own row with no column restrictions. A client (or any user) could call:
```ts
updateUserProfile({ role: 'admin' })
```
This would set `profiles.role = 'admin'`. Since the AuthContext fallback logic checks `profiles.role` when no `user_roles` entry exists, this could grant admin-level access.

**Fix**: Remove `role` from the `updateUserProfile` update payload entirely. Role should never be changeable from the client side.

---

### MEDIUM VULNERABILITIES

**2. `comments` table open to all authenticated users**

The `comments` table RLS has `auth.role() = 'authenticated'` for both SELECT and INSERT. Clients can read ALL internal order comments and insert comments on any order. These are internal team discussion notes.

**Fix**: Add `NOT is_client()` to `comments` SELECT and INSERT policies.

**3. `notifications` INSERT policy too permissive**

The `notifications` INSERT policy is `auth.uid() IS NOT NULL`. A client could craft notifications targeted at admin users (e.g., phishing-style fake alerts). The SELECT/UPDATE are properly scoped to `user_id = auth.uid()`.

**Fix**: Add `NOT is_client()` or restrict INSERT to only allow `user_id = auth.uid()` so users can only create notifications for themselves.

**4. `clientSupportService.ts` queries the `orders` table directly (line 101, 149, 354)**

The `fetchClientInquiryById` function queries `orders` for `company_name` without filtering by client_id. RLS on orders may expose data depending on policy evaluation (the SELECT policies are permissive and overlap). The `orders` RLS does have client filtering via `has_role`, but it's worth noting the direct `orders` table access from client service code.

**5. Multiple tables readable by all authenticated users (including clients)**

These tables have `qual: true` or `auth.role() = 'authenticated'` SELECT policies, meaning clients can read them:
- `calendar_events` — internal team calendar
- `inventory_items` — product inventory with buying prices  
- `order_audit_logs` — internal audit trail
- `comments` — internal order discussions
- `user_achievements` / `user_streaks` / `team_activities` — internal gamification
- `notification_settings` — system config
- `monthly_contracts` — internal contract data (authenticated users can view)
- `monthly_installments` — internal payment schedules

**Fix**: Add `NOT is_client()` to SELECT policies on internal-only tables.

---

### VERIFIED SECURE (No Issues Found)

| Area | Status | Details |
|------|--------|---------|
| **Route guards** | Secure | `RequireAuth` redirects clients to `/client/dashboard` for non-client routes. `ClientGuard` blocks non-clients from client routes. |
| **`user_roles` table** | Secure | Only admins can INSERT/UPDATE/DELETE. Users can only SELECT their own row. |
| **`messages` + `channels`** | Secure | `NOT is_client()` on all CRUD policies. InternalChat has UI guard + `.neq('role', 'client')` filter. |
| **`client_orders` view** | Secure | Uses explicit column selection, excludes internal_notes/assigned_to. RLS via `client_id = auth.uid()`. |
| **`orders` table** | Secure | INSERT requires `NOT has_role(client)`. UPDATE requires non-client + ownership. Client SELECT scoped to `client_id = auth.uid()`. |
| **`support_inquiries`** | Secure | Clients can only see/create their own (`user_id = auth.uid()`). |
| **`support_replies`** | Secure | Clients can only see/add replies to their own inquiries. |
| **Client notifications** | Secure | `ClientNotificationCenter` filters by `action_url LIKE '/client/%'`. RLS scoped to `user_id`. |
| **`invoices` / `invoice_line_items`** | Secure | Require `user_id` match or admin/agent role. |
| **`offers`** | Secure | `NOT is_client()` on SELECT/INSERT/DELETE. |
| **`client_email_logs`** | Secure | `NOT is_client()` on SELECT. |
| **Auth fallback logic** | Secure | Falls back to `profiles.role` before defaulting to `'user'`. |
| **Password change** | Secure | Uses Supabase Auth `updateUser`, properly validated client-side. |

---

### PROPOSED FIXES (5 changes)

**1. Remove role from updateUserProfile (CRITICAL)**
`src/context/AuthContext.tsx` — Remove the `role` field from the profiles update payload.

**2. Database migration — Lock down `comments` for clients**
```sql
DROP POLICY "Authenticated users can view comments" ON comments;
CREATE POLICY "Non-client users can view comments" ON comments
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT is_client());

DROP POLICY "Users can insert comments" ON comments;
CREATE POLICY "Non-client users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND NOT is_client());
```

**3. Database migration — Restrict `notifications` INSERT**
```sql
DROP POLICY "Authenticated can create notifications" ON notifications;
CREATE POLICY "Non-client users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND NOT is_client());
```

**4. Database migration — Restrict internal-only tables from clients**
Add `NOT is_client()` to SELECT policies on: `calendar_events`, `inventory_items`, `order_audit_logs`, `monthly_contracts`, `monthly_installments`, `notification_settings`.

**5. Database migration — Restrict `profiles` role column updates**
Create a trigger that prevents non-admin users from changing the `role` column on profiles (defense in depth).

### Files to Modify
- `src/context/AuthContext.tsx` — remove `role` from profile update
- Database migration — harden 8+ table RLS policies + add role-change prevention trigger

