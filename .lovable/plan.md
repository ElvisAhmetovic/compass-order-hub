# AI outreach: where client replies go, and who sent the offer

## How it works today
- The client gets the offer by email from "Media Marketing <noreply@mediaamarketing.com>".
- If the client clicks Reply, the reply goes to **invoice@mediaamarketing.com** (it is set as the reply address). There is no inbox inside the app, so right now replies only show up in that mailbox.
- The app does not record who on the team sent the offer.

## What "Won back" means
A client counts as "won back" when they place a **new order within 60 days after the offer was sent**. The app checks this automatically, puts a "Won back" badge on that offer, and shows the success rate at the top (for example "Won back: 2 of 10 sent (20%)").

## Changes
1. **Remember who sent it.** When a team member clicks Send, save their name and email on the offer, and show "Sent by Johann Nowak" on the AI Outreach page.
2. **Replies reach the team, with the sender's name.** The reply address becomes the whole team, labelled with the sender, e.g.
   `Reply to: "Johann Nowak (AI Outreach)" <invoice@mediaamarketing.com>, <johann.nowak@...>`
   so the client's reply lands in the shared mailbox **and** with the person who sent it, and everyone sees "Johann Nowak (AI Outreach)" in the address line.
3. **Name in the email itself.** Add a small line at the bottom of the offer: "Your contact: Johann Nowak". Since replies quote the original email, every reply forwarded to the team shows who sent it.
4. **Subject tag.** Add a short reference to the subject, e.g. "… [Ref JN-AO]", so the reply ("Re: … [Ref JN-AO]") shows the sender's initials right in the subject line, and the team can filter by it.

## Not included
- A real inbox inside the app (reading replies in the CRM). That needs changing the email domain's mail settings to receive email through Resend; it can be a later step if you want it.

## Technical details
- Migration: add `sent_by_user_id`, `sent_by_name`, `sent_by_email` to `outreach_drafts` (nullable, forward-only).
- `outreach-send`: set these from the verified caller; `reply_to` = [invoice@mediaamarketing.com, sender email]; append contact line to html/text; append subject ref.
- `AiOutreach.tsx`: show "Sent by …".
- Tests: reply-to list contains shared mailbox + sender; subject ref built from sender initials.
