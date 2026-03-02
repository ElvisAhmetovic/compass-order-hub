

## Fix: Include PDF + Rate-Limit Team Notifications in `send-invoice-pdf`

The `send-invoice-pdf` edge function currently sends team members a plain notification **without** the PDF attachment and fires all 12 emails in parallel, hitting Resend's rate limit.

### Changes

**File: `supabase/functions/send-invoice-pdf/index.ts`**

1. **Attach the PDF to team emails** — Include the same `attachments` array (with the base64 PDF) in team notification emails, plus the original message content
2. **Batch team emails** — Send in batches of 2 with 1-second delays between batches (same pattern as the cron job fix)

| Before | After |
|--------|-------|
| Team gets plain "Invoice Sent" notification, no PDF | Team gets the same email content + PDF attachment |
| All 12 team emails fired in parallel (rate limited) | Batched 2 at a time with 1s delay |

