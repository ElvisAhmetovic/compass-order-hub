# AI Client Re-engagement (Win-back Offers)

## What you get
A new **AI Outreach** page in the CRM sidebar, open to all team members.

1. **Find inactive clients.** Each day the system lists clients whose last order is more than **3 months** old. It skips clients who opted out of emails, have no email address, have an active monthly package, or were already contacted in the last 90 days.
2. **AI writes the offer.** For each client the AI reads their order history (which services, platforms, packages, amounts, language/country) and writes a short personal email in the client's language. The email mentions the services they used before and suggests related services we offer. It also writes a one-line **reason** for picking that client (example: "Last order 5 months ago, Google reviews; suggest Trustpilot + social media").
3. **Team approves first.** Nothing is sent automatically. Drafts wait on the page with status **Pending**. A team member can read, edit the subject and text, then click **Send** or **Reject**.
4. **Full history.** Every draft keeps: client, email, reason, the text, who approved it, when it was sent, status (Pending / Sent / Rejected / Failed), and the delivery result. You can filter and search it.
5. **Safety limits.** At most **50** offer emails per day. Sending only on weekdays 09:00 to 17:00 Sarajevo time. Sent from `Media Marketing <noreply@mediaamarketing.com>` with invoice@mediaamarketing.com as the contact, and an unsubscribe line that turns off future offers for that client.
6. **Manual run.** A "Find clients now" button on the page, besides the daily automatic scan.

## What the AI is told
- Use only real services from our order history and our service list. No made-up prices, discounts or promises.
- Use the company name "Media Marketing" and the client's language (German by default).

## Technical details
- New table `outreach_drafts` (client_id, email, language, reason, subject, body, status, created_by_ai_at, approved_by, sent_at, error, resend_id) with grants + RLS: team members (non-client roles) can read and update; clients cannot.
- Add `outreach_opt_out` to clients (unsubscribe link sets it through a public edge function with a signed token).
- Edge function `outreach-scan`: queries orders/clients/monthly_contracts, picks candidates, calls Lovable AI Gateway (`@lovable.dev/ai-gateway`, default chat model, strict JSON output) to make subject/body/reason, saves drafts. Scheduled daily on weekdays through pg_cron.
- Edge function `outreach-send`: checks the logged-in user, the daily 50 cap and the weekday window, sends via Resend (`RESEND_API_KEY_ABMEDIA`), one at a time, then updates the draft.
- Requires a Lovable API key for the AI step (created during setup).
- Page `src/pages/AiOutreach.tsx` + sidebar link; tests for the 3-month rule, 90-day cooldown and 50/day cap.
