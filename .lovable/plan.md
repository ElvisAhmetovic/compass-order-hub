# Review-aware win-back drafts

Yes, this is possible, with one limit: Google only gives outside apps up to **5 reviews per business** (the ones Google picks), not the full list. So the AI can spot new negative reviews among those 5, but it can miss some.

## What it will do
1. During the normal AI Outreach scan, for inactive clients whose past orders were about Google review removal, find their Google business profile using the company name and address from the order.
2. Read the public rating and the up to 5 reviews Google returns.
3. Flag reviews with 1–2 stars posted **after** their last order date.
4. If any are found, the AI writes a draft that mentions them in a factual way (for example "we noticed 2 new 1-star reviews since March"). It quotes only what Google shows and makes no promise that they can be removed.
5. The draft shows a "New negative reviews" badge plus the reviews (stars, date, text, link to the Google profile) so the team can check before sending.
6. If no profile is found, or there are no new negative reviews, the normal win-back draft is used as before.
7. The usual rules stay: human approval, 50/day, weekdays 09:00–17:00 Sarajevo, opt-outs, 90-day cooldown.

## What you need to do
- Connect **Google Maps** when the connect card appears. Google charges per lookup; only eligible review-removal clients are checked, at most 10 per scan.

## Technical details
- Connector: `google_maps`, Places API (New) `places:searchText` then Place Details with `reviews,rating,userRatingCount,googleMapsUri` field mask, from `outreach-scan`.
- Detect review-removal clients from existing order service descriptions (keywords: "bewertung", "review", "rezension", "löschung", "removal").
- Add `review_signals jsonb` and `google_place_id` to `outreach_drafts`; cache place ID per client email.
- Extend the draft prompt in `_shared/outreachDraft.ts` with the found reviews as grounded facts; add tests for the "negative and newer than last order" rule.
- UI badge and review list on the AI Outreach card.
