## Plan

1. **Update the runtime secret**
   - Set `GOOGLE_REVIEW_PLACE_ID` to the real Google Place ID:
     `ChIJ50FDykeVuEcRrf2fjhu8za4`
   - This is likely the main issue because the old numeric value is not hardcoded in the current source code.

2. **Redeploy the review email function**
   - Redeploy `send-review-request` so Supabase Edge Functions definitely reload the latest code and environment.

3. **Add a safety guard in the email function**
   - Add validation so if `GOOGLE_REVIEW_PLACE_ID` is accidentally set to a numeric CID again, the function refuses to send a broken review link and logs a clear error.
   - This prevents future emails from silently going out with `/local/writereview?placeid=11731173374506860818`.

4. **Clarify old emails behavior**
   - Already-sent emails cannot be changed. If someone clicks an older email, it will still contain the old broken link.
   - New emails sent after the secret update + redeploy should use the correct Place ID.

## Technical details

- Current code builds the button link from:
  `Deno.env.get("GOOGLE_REVIEW_PLACE_ID")`
- Code search found the old numeric ID only in `.lovable/plan.md`, not in the live function source.
- Existing review URL format is correct when the value is a real Place ID:
  `https://search.google.com/local/writereview?placeid=ChIJ50FDykeVuEcRrf2fjhu8za4`