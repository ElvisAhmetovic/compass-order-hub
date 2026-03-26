

## Security Hardening: Fix All Detected Vulnerabilities

### Overview
This plan addresses 9 security findings across database policies, edge functions, and views. Changes are ordered by severity. All fixes preserve existing functionality.

---

### 1. Fix `soft_delete_order` and `restore_order` — Add Authorization Guards

**Migration SQL**: Add `is_admin()` check inside both SECURITY DEFINER functions so only admins can call them.

```sql
CREATE OR REPLACE FUNCTION public.soft_delete_order(order_id_param uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can delete orders';
  END IF;
  UPDATE public.orders SET status_deleted = true, deleted_at = now(), updated_at = now()
  WHERE id = order_id_param;
END;
$$;
```

Same pattern for `restore_order`.

---

### 2. Fix Overly Permissive `clients` Table RLS Policies

**Drop** these 4 redundant/dangerous policies:
- `Authenticated users can delete all clients` (allows any user to delete any client)
- `Authenticated users can update all clients` (allows any user to update any client)
- `Users can delete their own clients` (uses `OR auth.uid() IS NOT NULL` which is always true)
- `Users can update their own clients` (same issue)
- `Authenticated users can create clients` (duplicate of owner-scoped one)
- `Users can create clients` (duplicate)

**Keep** the owner-scoped + admin policies:
- `Users can manage their clients` (ALL, owner OR admin)
- `Users can view their clients` (SELECT, owner OR admin)
- `Users can view their own clients` (ALL, owner OR admin)
- `Users can create their own clients` (INSERT, owner check)

---

### 3. Fix Profile Enumeration — Restrict Blanket SELECT

**Drop**: `Allow authenticated users to view profile names for rankings`  (USING true — exposes all profiles)

**Create** a new restricted view for rankings instead:

```sql
CREATE OR REPLACE VIEW public.ranking_profiles
WITH (security_invoker = true) AS
SELECT id, first_name, last_name FROM profiles;
```

Then grant SELECT on the view only to authenticated, and add an RLS-like filter in the app code. However, since rankings need all non-client users' names, a simpler approach: replace the `USING(true)` policy with one that excludes clients:

```sql
CREATE POLICY "Non-clients can view all profiles for rankings"
ON profiles FOR SELECT TO authenticated
USING (NOT public.is_client());
```

This means admins/agents/users can see all profiles (needed for rankings, collaboration, etc.) but client-role users cannot enumerate team members.

---

### 4. Fix `user_achievements` INSERT — Restrict to Own Records

**Drop**: `Authenticated can insert achievements` (no user_id check)

**Create**:
```sql
CREATE POLICY "Users can insert own achievements"
ON user_achievements FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
```

---

### 5. Fix `user_audit_logs` INSERT — Restrict actor_id

**Drop**: `Authenticated users can insert logs` (no actor_id check)

**Create**:
```sql
CREATE POLICY "Users can insert own audit logs"
ON user_audit_logs FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());
```

---

### 6. Fix Exposed `auth.users` — Drop `team_members_view`

The `team_members_view` joins `auth.users` to get email addresses, exposing the auth schema. Replace it:

```sql
DROP VIEW IF EXISTS public.team_members_view;
```

Then create a SECURITY INVOKER view that uses `app_users` instead of `auth.users`:

```sql
CREATE VIEW public.team_members_view
WITH (security_invoker = true) AS
SELECT p.id, a.email,
  concat_ws(' ', p.first_name, p.last_name) AS full_name
FROM profiles p
LEFT JOIN app_users a ON a.id = p.id
WHERE p.role <> 'client' AND p.disabled = false;
```

This also fixes the **security definer view** finding.

---

### 7. Fix `client_orders` View — Set SECURITY INVOKER

The `client_orders` view currently defaults to SECURITY DEFINER. Recreate with SECURITY INVOKER:

```sql
DROP VIEW IF EXISTS public.client_orders;
CREATE VIEW public.client_orders
WITH (security_invoker = true) AS
SELECT ... (same columns as current definition);
```

---

### 8. Add JWT Auth to Edge Functions That Need It

Update `supabase/config.toml` to set `verify_jwt = true` for functions that are called from authenticated client code. Then add in-code JWT validation as a defense-in-depth layer.

**Set `verify_jwt = true`** for these functions (called from authenticated UI):
- `send-client-payment-reminder`
- `sync-order-to-sheets`
- `send-client-invite`
- `send-client-status-notification`
- `send-support-inquiry-notification`
- `send-service-delivered-notification`
- `send-invoice-pdf`
- `translate-upsell`
- `send-monthly-toggle-notification`
- `send-client-portal-credentials`
- `send-offer-email`
- `send-order-created-notification`
- `send-order-confirmation` (if exists in config)
- `notify-password-change`
- `request-client-credentials`

**Keep `verify_jwt = false`** for these (public/cron/unauthenticated by design):
- `confirm-offer` (public link from email)
- `create-client-ticket` (public ticket submission)
- `check-daily-attendance` (cron)
- `send-order-payment-reminders` (cron)
- `send-invoice-payment-reminders` (cron)
- `send-follow-up-reminders` (cron)
- `generate-monthly-installments` (cron)

---

### 9. Add Basic Input Validation to Key Edge Functions

Add email format validation and string length checks to the most exposed functions. This is a targeted improvement, not a full rewrite:

- `send-payment-reminder`: validate `to` is valid email, `subject` max 200 chars
- `send-client-invite`: validate email format
- `send-invoice-pdf`: validate email format
- `send-support-inquiry-notification`: validate emails array, cap at 20 entries

Pattern:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
}
```

---

### Files to Modify

1. **New migration** — All SQL changes (functions, policies, views) in a single migration
2. **`supabase/config.toml`** — Set `verify_jwt = true` for ~15 functions
3. **`supabase/functions/send-payment-reminder/index.ts`** — Add input validation
4. **`supabase/functions/send-client-invite/index.ts`** — Add input validation
5. **`supabase/functions/send-invoice-pdf/index.ts`** — Add input validation
6. **`supabase/functions/send-support-inquiry-notification/index.ts`** — Add input validation + cap emails array
7. **`supabase/functions/send-client-payment-reminder/index.ts`** — Add input validation
8. **`supabase/functions/translate-upsell/index.ts`** — Add input validation

### What This Does NOT Change
- No UI changes
- No breaking changes to existing functionality
- Edge functions called from authenticated pages already pass JWT headers via `supabase.functions.invoke()`
- Public functions (confirm-offer, create-client-ticket) remain accessible
- Cron functions remain accessible

