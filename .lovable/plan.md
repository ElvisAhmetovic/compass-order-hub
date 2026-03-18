

## Send Test Reminder Email to jungabmedia@gmail.com

The current `send-invoice-payment-reminders` function only processes real invoices from the database — it can't send a standalone test email.

### What I'll Do

I'll invoke the edge function via `curl` to trigger it. If there are no invoices currently due for reminders, no email will be sent. Instead, the better approach is:

**Option: Direct test call using Resend via a temporary test invocation**

I'll call the edge function and add a `test_mode` parameter that:
1. Accepts a `test_email` address and a `test_language` (e.g. `de`, `nl`, `en`)
2. Builds the email HTML using sample/demo data (fake invoice, fake company)
3. Sends it only to the specified test email address
4. Does NOT touch any real invoices or send to the team

### Changes

**`supabase/functions/send-invoice-payment-reminders/index.ts`**
- Add a check at the top of the handler: if request body contains `{ test_mode: true, test_email: "...", test_language: "de" }`, build and send a single demo email with sample data to that address, then return immediately
- Sample data: "Muster GmbH", invoice "INV-2026-TEST", €1.299,00, address "Berlin, Deutschland", reminder #1
- After sending the test, I'll invoke it with `test_email: "jungabmedia@gmail.com"` and `test_language: "de"` so you can see the German template

This way you can test any language anytime without affecting real data.

