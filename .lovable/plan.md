

## Fix Portal URL in Client Credentials Email

### Problem
1. The `send-client-portal-credentials` edge function uses the `portalUrl` parameter passed from the frontend, which is `window.location.origin + "/client/login"` — this sends the preview/dev URL to clients instead of the production URL (`https://empriatech.com/client`).
2. The internal team copy email doesn't include the portal login link either.

### Solution
Use `APP_URL` environment variable in the edge function (same pattern as all other edge functions), ignoring the client-passed `portalUrl`.

### Changes

**`supabase/functions/send-client-portal-credentials/index.ts`**
- Add `const APP_URL = Deno.env.get("APP_URL") || "https://www.empriadental.de";`
- Replace usage of the passed `portalUrl` with `${APP_URL}/client/login`
- Add the portal login link to the internal team email HTML

**`src/components/dashboard/CreateClientPortalModal.tsx`**
- Remove the `portalUrl` construction from the frontend (no longer needed since the edge function handles it)

### Note
The `APP_URL` secret is already configured in Supabase. Need to verify it's set to `https://empriatech.com` — if the production URL has changed from the old `empriadental.de`, the secret should be updated.

