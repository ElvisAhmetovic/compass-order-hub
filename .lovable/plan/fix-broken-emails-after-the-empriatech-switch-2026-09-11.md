# Fix broken emails after the empriatech switch

## What is actually broken

Two separate problems, both caused by the recent sender change.

**1. Five email types have no working email key.**
The system has one email key stored, named `RESEND_API_KEY_ABMEDIA`. Most emails use it and still work (invoice reminders were sent successfully as recently as this morning). But these five ask for a key called `RESEND_API_KEY`, which does not exist, so every send fails immediately:

- Password changed notification
- Order confirmation to the client
- Order status change alert to the team
- Tech support ticket notification
- Support inquiry notification

**2. The new sender address is very likely not accepted.**
Six functions were switched to send from `noreply@empriatech.com`. The email domain `empriatech.com` is not registered/verified for sending in this workspace. Emails from an unverified domain are rejected by the mail provider. Everything still sending from `noreply@abm-team.com` keeps working — which matches what you are seeing.

## The fix

1. Point all five broken functions at the existing key `RESEND_API_KEY_ABMEDIA`, with a fallback so either key name works.
2. Switch the six `noreply@empriatech.com` senders back to `AB Media Team <noreply@abm-team.com>` — the address that is proven to deliver — so email works again today.
3. Redeploy the affected functions.
4. Check the stored app address used in email buttons (work hours reminder, dashboard links, portal links) still resolves to the live site, and correct it if not.
5. Run a live send test per category (password change, order confirmation, status change, tech support, support inquiry, work hours link) and read the send logs to confirm delivery instead of assuming.

## About using empriatech.com as the sender

If you want emails to come from `noreply@empriatech.com` (rather than `abm-team.com`), that domain has to be verified for sending first: add the DNS records the mail provider gives you for empriatech.com and wait for it to show as verified. Once verified, flipping the six senders over is a one-line change each. Until then, keeping `abm-team.com` is what keeps mail flowing.

## Technical detail

- Affected files: `notify-password-change`, `send-order-confirmation`, `send-tech-support-notification`, `send-status-change-notification`, `send-support-inquiry-notification`, `send-service-delivered-notification` under `supabase/functions/`.
- Key read becomes `Deno.env.get("RESEND_API_KEY_ABMEDIA") ?? Deno.env.get("RESEND_API_KEY")`, with a clear error when both are missing.
- Failed provider responses will be logged with status and body so a rejected sender domain is visible in the logs instead of failing silently.
- `APP_URL` secret verified against the live custom domain.
