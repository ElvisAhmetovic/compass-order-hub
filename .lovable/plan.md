
## Fix: Redeploy Edge Function and Add Error Logging

### Root Cause

The code in `orderService.ts` and the edge function `send-client-status-notification` both have the correct logic to send emails to `contact_email`. However, the edge function was likely **not redeployed** after the last code changes. The deployed version still has the old code that only works with `client_id` (portal users).

Evidence:
- The Resend dashboard (image 3) shows [CSM Alert] team notifications were sent successfully -- so the team notification edge function works fine
- But **zero** logs exist for `send-client-status-notification` -- meaning either it wasn't called or the deployed version crashed before logging
- Email History tab (image 2) shows no client emails were sent

### Fix

1. **Redeploy the edge function** `send-client-status-notification` so the deployed version includes the `contact_email` fallback path

2. **Add better console logging** in `orderService.ts` around the client notification call so we can see in the browser console whether the function was invoked and what happened

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-client-status-notification/index.ts` | Redeploy (no code change needed -- code is already correct) |
| `src/services/orderService.ts` | Add console.log before and after the client notification call for debugging visibility |
