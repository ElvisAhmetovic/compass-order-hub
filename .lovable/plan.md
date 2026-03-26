

## Security Changes Impact Analysis

After reviewing all security changes made in migration `20260326083626` and the config.toml updates, here are the findings organized by severity.

---

### Confirmed Breakage (Already Fixed)

**`team_members_view` with `security_invoker = true`** — This broke the Reminders assignee dropdown for non-admin users because `app_users` RLS restricted visibility. Already fixed in migration `20260326085431` by reverting to `security_invoker = false` with `JOIN auth.users`.

---

### No Breakages Found — All Changes Are Safe

After tracing every security change through the codebase, **no additional breakages were identified**:

**1. `soft_delete_order` / `restore_order` — Admin-only guard**
- These functions now require `is_admin()`. The delete button in `OrderActions.tsx` and `OrderRow.tsx` is visible to all users but will throw an error for non-admins.
- **Not a breakage** — this is the intended security fix. Non-admin users should not delete orders.
- **Improvement opportunity**: Hide the delete button in the UI for non-admin users so they don't see a button they can't use. This is cosmetic, not a functional break.

**2. Dropped permissive `clients` table policies**
- The remaining policies (`Users can manage their clients`, `Users can view their clients`, `Users can create their own clients`) all scope access to `auth.uid() = user_id OR is_admin()`.
- All client CRUD in `invoiceService.ts` runs under the authenticated user's session, so owner-scoped access works correctly.

**3. Profile enumeration fix**
- Replaced blanket `USING(true)` with `NOT is_client()`. Non-client users (admin, agent, user) can still see all profiles for rankings, collaboration, and user management.
- Client-role users can still read their own profile via `Profiles: allow select for resource owner`.

**4. `user_achievements` and `user_audit_logs` INSERT restrictions**
- Now restricted to `user_id = auth.uid()` and `actor_id = auth.uid()` respectively. The app code already sets these to the current user, so no change in behavior.

**5. `client_orders` view — `security_invoker = true`**
- Clients querying this view now go through RLS on `orders` and `companies`. The `orders` table has a client SELECT policy (`client_id = auth.uid()`), and `companies` has `Authenticated users can view companies`. Both allow client access.
- Internal users have broader SELECT policies on orders. No breakage.

**6. Edge function JWT changes**
- All functions set to `verify_jwt = true` are called via `supabase.functions.invoke()` which automatically passes the JWT. No breakage.
- Public/cron functions (`confirm-offer`, `create-client-ticket`, `check-daily-attendance`, payment reminder crons) remain `verify_jwt = false`.
- Functions not in config.toml (`send-order-confirmation`, `send-status-change-notification`, etc.) use Supabase's default, which works with `supabase.functions.invoke()`.

**7. Input validation in edge functions**
- Added email regex and length checks. These are additive validations that won't reject valid inputs.

---

### Recommended UI Improvement (Optional)

Hide the "Delete" button for non-admin users in `OrderActions.tsx` and `OrderRow.tsx` since the backend now blocks them. This prevents confusion but is not a functional break.

**Files**: `src/components/dashboard/OrderActions.tsx`, `src/components/dashboard/OrderRow.tsx`
**Change**: Wrap the delete button/menu item with `{user?.role === 'admin' && ...}`

---

### Verdict

The only breakage was the `team_members_view` issue, which is already fixed. All other security changes are working as intended with no functional regressions.

