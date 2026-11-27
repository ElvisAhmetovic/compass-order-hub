# Finish activating the outreach Replies inbox

Resend receiving and the webhook are set up. Remaining steps:

1. Open a secure form for the webhook signing secret (`RESEND_INBOUND_WEBHOOK_SECRET`, starts with `whsec_`, copied from Resend → Webhooks → your endpoint). You paste it there, never in chat.
2. Save `OUTREACH_INBOUND_DOMAIN` = `replies.mediaamarketing.com` so new offers use a per-offer reply address (`reply+<offer>@replies.mediaamarketing.com`).
3. Redeploy `outreach-send` and `outreach-inbound` so they pick up both settings.
4. Check: an unsigned call to the reply endpoint is still rejected; then you send one approved offer to the test client and reply to it, and I confirm it appears in AI Outreach → Replies and opens a Customer Ticket.

Offers sent before this keep their old reply address.
