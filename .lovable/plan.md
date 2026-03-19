

## Send Follow-Up Reminders to All Team Members

### Problem
Currently, the `send-follow-up-reminders` edge function only sends the reminder email to the single assignee (`reminder.assignee_email`). It should send to all 12 hardcoded team notification emails.

### Changes

**`supabase/functions/send-follow-up-reminders/index.ts`**
- Hardcode the same 12-recipient notification list used across other edge functions
- Replace the single `to: [reminder.assignee_email]` with batched sending to all 12 recipients (2 per batch, 1s delay between batches — matching the existing rate-limit pattern used in other notification functions)
- Keep the assignee info in the email body so the team knows who was originally assigned

This is a single-file change. The edge function will be redeployed automatically.

