# Fix invoices and offers landing in spam

## What I found (checked the live DNS just now)

Your emails send from `noreply@abm-team.com` through Resend. The domain's DNS setup has real gaps:

1. **SPF does not allow Resend to send.** The SPF record only lists IONOS and Google. Resend's server is not on it, so receivers see a failed SPF check on every invoice.
2. **No DMARC record at all.** Gmail, Outlook and Yahoo now penalize senders without DMARC — this alone pushes mail to spam.
3. DKIM is correctly set up (record exists, domain is verified in Resend), so that part is fine.

**This is why switching Resend accounts would NOT help** — the problem is your DNS, not the account. A new account would even make it worse: it starts with zero reputation and no warm-up, so spam placement would likely increase for weeks.

## The fix (DNS records, you or I can guide whoever manages the domain)

At the registrar for `abm-team.com`:

1. **Update SPF** — add Resend's include to the existing record so it reads:
   `v=spf1 include:_spf-eu.ionos.com include:_spf.google.com include:amazonses.com ~all`
2. **Add DMARC** (TXT record on `_dmarc.abm-team.com`):
   `v=DMARC1; p=none; rua=mailto:invoice@team-abmedia.com`
   `p=none` means "monitor only" — nothing gets rejected, we just get reports.
3. Wait for DNS to propagate (usually under an hour).

## Verification after the change

- I re-check the DNS records to confirm they are live.
- Send a test email to mail-tester.com (free) and aim for a score of 9+/10 — it shows exactly which checks pass or fail.
- You send one invoice and one offer to a Gmail address you own and confirm it reaches the inbox.
- After 2–4 weeks of clean DMARC reports, DMARC can be tightened later if wanted (optional).

## Optional follow-ups if spam complaints continue after this

- Ask clients for one example with full email headers so I can read the exact spam verdict.
- Move bulk team notifications off the client-facing sender to a separate subdomain.
- Only after all that: consider a dedicated sending IP or a new account — as a last resort, never the first move.
