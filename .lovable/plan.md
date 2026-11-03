# AI Win-Back Offers

An AI assistant in the CRM finds clients who haven't ordered in 3+ months, writes a personal offer email for each one, and saves it as a draft. A team member reviews each draft and approves it before anything is sent. Every draft and send is logged.

## What you get

1. **New page "AI Win-Back"** (admins only), in the sidebar.
2. **"Find inactive clients" button**: the AI goes through orders, packages and invoices and lists clients whose last order was 3+ months ago.
   - Skipped: clients with an active monthly package, clients with an unpaid open invoice, clients who opted out of emails, and clients with no email.
3. **The AI writes a draft offer for each client**:
   - in the client's language (same country detection the invoices use)
   - mentions the services they bought before, and suggests related services from our list (Google reviews, social media, websites and so on)
   - signed by Media Marketing, sent from noreply@mediaamarketing.com, replies go to invoice@mediaamarketing.com
   - the AI also writes a short reason for each pick (e.g. "Last order 7 months ago: Google review package")
4. **Review screen**: each draft shows client, reason, subject and message. Buttons: **Edit**, **Approve & send**, **Reject**. Nothing goes out without a click.
5. **History log**: who it was sent to, when, why, who approved it, the full email text, and the status (draft / sent / rejected / failed). Filters by status and date.
6. **Safety**: a client gets at most one win-back email every 90 days; sending is spaced out so the email service isn't overloaded; a copy of each sent offer goes to invoice@mediaamarketing.com.

## Notes
- AI drafts can contain mistakes, so the approval step stays required.
- Prices are not invented: the AI only names service types, never amounts, unless the client paid that price before.
- Each AI run uses some AI credits (small per client).

## Technical details
- Table `winback_campaign_emails` (client_id, email, language, reason, last_order_at, past_services jsonb, subject, body_html, status, created_by, approved_by, sent_at, error, resend_id). Admin-only RLS via `is_admin()`, plus grants.
- Edge function `winback-generate`: admin JWT check; picks candidates with SQL (last order < now() − 3 months; excludes active monthly_contracts, unpaid invoices, opted-out); limit 25 per run; dedup against drafts or sends in the last 90 days; calls the Lovable AI Gateway (default chat model, strict JSON schema output) for subject, body and reason; inserts drafts.
- Edge function `winback-send`: admin check, sends one approved draft through Resend (`RESEND_API_KEY_ABMEDIA`), queued with a delay, updates status.
- Frontend page `src/pages/WinBack.tsx` plus a sidebar link; tests for the eligibility rules (3 months, package and unpaid exclusions, 90-day cooldown).
