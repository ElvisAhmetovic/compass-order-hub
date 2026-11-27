# End-to-end test: outreach offer → reply → Replies + ticket

No outreach draft exists for the test client yet (checked: none for invoice+portaltest@mediaamarketing.com).

## Steps
1. Create one pending outreach draft for the test client (company from their client record, short test subject/body marked "TEST").
2. Approve and send it via `outreach-send`, so it goes out with the per-offer reply address `reply+<draftId>@replies.mediaamarketing.com`.
3. Reply: I can't log into the test mailbox, so I send a real email through Resend from `invoice+portaltest@mediaamarketing.com` to that reply address. It travels the same path a client reply would (Resend receiving → signed webhook → `outreach-inbound`).
4. Check (read-only queries + edge logs):
   - a new `outreach_replies` row linked to the draft, with `company_name` filled in
   - one new `customer_tickets` row with `outreach_reply_id` set, subject "Outreach reply: …"
   - follow-up status shows "skipped: template off" (unless the switch is on)
5. Open AI Outreach → Replies in the browser and confirm the business name and "View client" show.
6. Report the result. Test rows stay until you say "delete test client".

## Technical details
- Draft inserted with the service-level path used by `outreach-scan` fields (client_id, email, company_name, language, subject, body, status pending).
- Reply sent via Resend API with `RESEND_API_KEY_ABMEDIA`; no secrets printed.
- If no reply arrives within ~2 minutes, check Resend webhook delivery and `outreach-inbound` logs and report the cause.
