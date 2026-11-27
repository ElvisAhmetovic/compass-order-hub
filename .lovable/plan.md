# Bring office@mediaamarketing.com mail into Replies

## Current state (checked)
- mediaamarketing.com mail is handled by Google (Gmail / Google Workspace). office@ lives there, so the app cannot read it today.
- Only replies.mediaamarketing.com is received by Resend and passed to the app; offer replies use per-offer addresses on it.

Moving the whole domain's mail to Resend would break every Google mailbox, so instead office@ keeps working in Gmail and sends a copy into the app.

```text
client -> office@mediaamarketing.com (Gmail, still delivered)
             | automatic forward (Gmail setting)
             v
        office@replies.mediaamarketing.com -> Resend -> app -> Replies tab
```

## Steps
1. You (one-time, in Gmail for office@): Settings -> Forwarding -> add `office@replies.mediaamarketing.com`, keep a copy in the inbox. Gmail sends a confirmation code; it will arrive in the app's Replies tab and I'll show you where to read it.
2. App: mail arriving at `office@replies...` is stored in Replies with an "Office inbox" label, the original client as sender (taken from the forwarded From/Reply-To), matched to the client and business name like offer replies.
3. If the email's subject carries an offer reference, it is linked to that offer; otherwise it shows as a general message.
4. Same rules as now: newsletters/bulk mail marked and no ticket; a ticket opens only for known clients or offer-linked mail; duplicates (same message arriving via both paths) are stored once.
5. No forwarding to team inboxes for office@ mail (it is already in the Gmail office inbox) — avoids loops.
6. Replies tab gets a filter: All / Offer replies / Office inbox. Answering from the app works the same and sends from office@.

## Technical details
- `outreach-inbound`: recognise local part `office` on OUTREACH_INBOUND_DOMAIN; add `source` ('offer' | 'office') to `outreach_replies` (forward-only migration, default 'offer'); dedupe on Message-ID; skip `shouldForwardReply` for source office; ignore mail sent from our own team/office address.
- Tests (Given/When/Then) for source detection, sender extraction from forwarded mail, dedupe, and no-forward rule.
- AGENTS.md rule for office inbox ingestion.

## Not covered
- Old emails already in the office@ Gmail inbox are not imported (only new ones after forwarding is switched on).
