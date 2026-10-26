# Fix: marcusabmedia@gmail.com not receiving emails

## What we know
- Marcus's address is on every team email list.
- Today's order-confirmation logs say the email to marcusabmedia@gmail.com was accepted by the mail service (id 01a177d8-c91d-...).
- So our system is sending it. The problem is probably later in delivery (bounce, block, suppression) or in his Gmail.

## Steps
1. Check the mail service (Resend) status for Marcus's recent messages: delivered, bounced, complained, or on the suppression list.
2. If his address is suppressed or bounced: remove it from the suppression list and send one test email.
3. If the mail service says "delivered": tell Marcus to check Gmail filters, forwarding, blocked senders, and "All Mail" for noreply@mediaamarketing.com, then send a test email.
4. Check that the address has no typo or hidden spaces in saved settings (notification email settings in the database).
5. Send a test email to marcusabmedia@gmail.com and confirm the result.

## Technical details
- Query Resend's API with RESEND_API_KEY_ABMEDIA for the email ids from the logs (`GET /emails/{id}`) to read `last_event`.
- Check `app_settings`/notification email rows for the stored address.
- No code changes unless step 4 finds a bad stored value.
