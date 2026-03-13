

## Notify Admins on Client Password Change

### What's happening now
The `updatePassword` function in `AuthContext.tsx` already calls `supabase.auth.updateUser({ password })` which works correctly with Supabase Auth. The password does get updated in the system. The missing piece is the admin notification email.

### Plan

#### 1. Create Edge Function `notify-password-change`
New file: `supabase/functions/notify-password-change/index.ts`

- Accepts: `{ userEmail, userName, companyName, newPassword }`
- Uses `RESEND_API_KEY` (empriadental.de domain) to send an email to `jungabmedia@gmail.com` and `kleinabmedia1@gmail.com`
- Email subject: "Client Password Changed - {companyName}"
- Email body includes: user email, company name, and the new password
- Standard CORS headers, no JWT verification needed (called from authenticated client)

#### 2. Update `supabase/config.toml`
Add `verify_jwt = false` entry for `notify-password-change`.

#### 3. Update `src/pages/client/ClientSettings.tsx`
After a successful `updatePassword()` call in `handleChangePassword`, fire-and-forget invoke `notify-password-change` with:
- `user.email`
- `user.full_name`
- Company name (fetched from orders or passed from user context)
- The new password (before clearing the field)

Need to look up how to get the company name for the client.

#### 4. Get company name
Query the client's company from the `companies` table where `client_user_id = user.id`, or from the user's orders. Will check the data model.

### Files to create/modify
- **Create**: `supabase/functions/notify-password-change/index.ts`
- **Modify**: `supabase/config.toml` — add verify_jwt entry
- **Modify**: `src/pages/client/ClientSettings.tsx` — call edge function after password change

