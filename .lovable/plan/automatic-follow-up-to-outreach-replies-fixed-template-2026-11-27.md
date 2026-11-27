# Automatic follow-up to outreach replies (fixed template)

## What the team gets
- A new **"Reply follow-up"** card on the AI Assistant page: an on/off switch plus English and German subject and message fields, with a preview. Admins edit and save it; it is plain text the team wrote, never AI-generated.
- Placeholders you can use: `{client_name}`, `{company_name}`, `{sender_name}` (the team member who sent the offer).
- When a client replies to an offer, the follow-up is sent at once in the offer's language, **from** `Media Marketing <reply@replies.mediaamarketing.com>`, with replies going back to the same offer's reply address so the conversation stays in the Replies inbox.
- In Replies, each reply shows "Follow-up sent 27.11.2026 13:50" (or why it was skipped).

## Safety rules
- Off by default until you save and switch it on.
- At most **one** follow-up per offer; a second reply from the client gets none.
- No follow-up for out-of-office/automatic emails, bounces, our own addresses, or clients who opted out of outreach.
- Replies not linked to an offer get no follow-up (only a ticket).

## Starter wording (editable before switching on)
- EN subject: "Thanks for your reply" — "Hello {client_name}, thank you for getting back to us. {sender_name} will contact you personally shortly. Kind regards, Media Marketing"
- DE subject: "Danke für Ihre Rückmeldung" — "Hallo {client_name}, vielen Dank für Ihre Rückmeldung. {sender_name} meldet sich in Kürze persönlich bei Ihnen. Mit freundlichen Grüßen, Media Marketing"

## Technical details
- Migration: table `outreach_reply_template` (single row: enabled, subject_en, body_en, subject_de, body_de, updated_by), grants + RLS: team reads, admins update. Add `followup_sent_at`, `followup_status` (sent / skipped:<reason> / failed) to `outreach_replies`; partial unique index on `draft_id` where `followup_status='sent'` to enforce one per offer.
- `_shared/outreachRules.ts`: pure `renderReplyFollowUp(template, lang, vars)` (escapes HTML) and `shouldSendFollowUp({ template, draft, headers, from, optedOut, alreadySent })` checking auto-reply headers (`Auto-Submitted`, `X-Autoreply`, `Precedence: bulk/auto_reply`), subject markers ("Out of office", "Abwesenheit", "Automatic reply"), mailer-daemon/noreply senders and our domains.
- `outreach-inbound`: after storing reply + ticket, evaluate and send via Resend (`RESEND_API_KEY_ABMEDIA`), record status; failures never block storing the reply.
- `AdminAssistant.tsx`: new `ReplyFollowUpTemplate` card (admin-only save).
- `OutreachReplies.tsx`: follow-up status line.
- Tests: unit tests for render + every skip rule; Deno tests stay green; redeploy `outreach-inbound`.
- AGENTS.md rule: outreach reply follow-ups use only the team-written template.
