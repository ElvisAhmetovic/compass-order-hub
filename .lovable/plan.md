# AI Outreach: recommended next additions

The current setup works like this: AI writes the draft, a person approves it, and it gets sent. These additions would make it more useful and safer. Pick the ones you want. Quick wins come first.

## Finish first (open items)
1. Complete the QA round: Reject test 2, Send test, and the unsubscribe click. Then delete the test entries.
2. Publish so colleagues can open AI Outreach.

## Quick wins
3. **"Regenerate" button**: if a draft is weak, the AI rewrites it, optionally with a short instruction ("shorter", "more formal").
4. **Reason shown on each draft**: "Last order 5 months ago: SEO package, €399,99", so the reviewer sees why this client was picked.
5. **Send test to me**: sends the draft to the reviewer's own inbox before it goes to the client.
6. **Daily summary**: one email each morning to the team, e.g. "8 new drafts waiting for review".

## Measuring results
7. **Reply and win-back tracking**: mark a client as "won back" when they place a new order within 60 days of an offer. Show the conversion rate on the AI Outreach page.
8. **Stats tab**: drafts created, sent, rejected, won back, and revenue from won-back orders. Totals in € would follow the existing owner-only finance rule.

## Smarter targeting
9. **Follow-up draft**: if there's no reply after 14 days, one gentle follow-up draft, still needing approval. Never more than one.
10. **Priority score**: sort pending drafts by past spend and number of orders, so the most valuable clients get reviewed first.
11. **Manual "draft for this client"** button on a client or order page.

## Safety and quality
12. **Rejection reasons** (wrong tone, wrong service, bad timing). The AI uses them to improve future drafts.
13. **Warning flag** when a draft mentions a price, discount, or promise that isn't in the order history.

## Technical details
- Regenerate, the warning flag and manual drafting reuse the outreach-scan AI call through a new single-draft action. The no-invented-claims rules stay in outreachRules.ts.
- Win-back tracking: a scheduled check links new orders to sent drafts by client email and stores `won_back_order_id` on outreach_drafts.
- Follow-ups add a `parent_draft_id` and a 14-day rule, with tests next to the existing outreachRules tests.
- Every send keeps the existing safeguards: human approval, max 50 per day, weekdays 09:00–17:00 Sarajevo time, and opt-outs.

## Suggested order
Start with 1–2. Then build 3, 4, 5 and 7. Do the rest later.
