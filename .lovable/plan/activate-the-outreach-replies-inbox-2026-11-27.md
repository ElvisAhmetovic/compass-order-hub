# Activate the outreach Replies inbox

The inbox (AI Outreach → Replies) is already built. These steps make client replies land there.

## Your steps (about 10 minutes)
1. **Resend → Domains → Add domain:** enter `replies.mediaamarketing.com`, then turn on **Receiving** for it.
2. **At your domain provider (where mediaamarketing.com DNS is managed):** add the **MX record** Resend shows for `replies` (copy host, value and priority exactly). This only affects the new `replies.` subdomain, so your existing mailboxes keep working. Wait until Resend shows it as verified (minutes to a few hours).
3. **Resend → Webhooks → Add endpoint:**
   - URL: `https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/outreach-inbound`
   - Event: **email.received**
   - After saving, copy the **Signing secret** (starts with `whsec_`).
4. Tell me "setup done".

## My steps after that
- Open a secure form for the signing secret (`RESEND_INBOUND_WEBHOOK_SECRET`) — you paste it there, never in chat.
- Set `OUTREACH_INBOUND_DOMAIN` to `replies.mediaamarketing.com` so new offers use a per-offer reply address.
- Redeploy the outreach functions and send one test offer to the test client, reply to it, and confirm it shows in Replies and opens a Customer Ticket.

## Notes
- Offers already sent keep replying to the old address; only new offers use the inbox.
- Changes reach colleagues after publishing.
