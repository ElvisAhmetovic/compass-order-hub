

## Send Team Notification When Monthly Contract Is Created

### What Changes
When a new monthly contract is created, send a notification email to all 12 team members (same list as order creation), using a new Edge Function with branded HTML similar to the order confirmation email.

### Files to Change

**1. New Edge Function: `supabase/functions/send-monthly-contract-created/index.ts`**
- Branded HTML email template similar to `send-order-confirmation`
- Shows: company name, email, phone, total value, duration, billing frequency, installment amount, start date, assigned to, description
- Uses `RESEND_API_KEY_ABMEDIA` (abm-team.com domain, consistent with other monthly package emails)
- Sends to all 12 team recipients in batches of 2 with 1-second delay (rate limit pattern)
- Subject: "📋 New Monthly Contract – [Company Name]"

**2. Update `src/components/monthly/CreateMonthlyContractModal.tsx`**
- After successful contract creation (line ~183), fire-and-forget call to `supabase.functions.invoke('send-monthly-contract-created', ...)` with the contract details
- Non-blocking — modal closes immediately, emails send in background

### Technical Details
- Follows the same batching pattern (2 emails/batch, 1s delay) used by other monthly package notification functions
- Uses the hardcoded team email list from `NOTIFICATION_EMAIL_LIST` (embedded in the Edge Function, same as other functions)
- Uses `RESEND_API_KEY_ABMEDIA` + `noreply@abm-team.com` sender (matching monthly package email conventions)

