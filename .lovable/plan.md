## Problem

The review email link goes to:

```
https://search.google.com/local/writereview?placeid=11731173374506860818
```

…and Google returns 404.

The reason: `11731173374506860818` is a **CID** (the numeric Google Maps customer ID), not a **Place ID**. The `writereview?placeid=` endpoint only accepts true Place IDs, which always start with `ChIJ…` (e.g. `ChIJN1t_tDeuEmsRUsoyG83frY4`). That's why every email we send right now lands on the 404.

## Two ways to fix it

### Option A — Replace the secret with the real Place ID (recommended)

Get the proper Place ID for the AB Media Team Google Business listing and store it in the `GOOGLE_REVIEW_PLACE_ID` secret. Tools:

- [https://developers.google.com/maps/documentation/places/web-service/place-id](https://developers.google.com/maps/documentation/places/web-service/place-id) (official "Find your Place ID" tool)
- It will return a value like `ChIJ....`

No code change needed — the edge function already builds the correct URL once the secret is a real Place ID.

### Option B — Keep the CID and switch the URL format

If you'd rather not hunt down the Place ID, we can change the edge function to use the CID-based review URL instead:

```
https://search.google.com/local/writereview?placeid=  ❌ needs Place ID
https://www.google.com/maps?cid=<CID>                ✅ works with CID, but opens the listing, not the review composer
https://g.page/r/<PAGE_ID>/review                    ✅ direct review composer, but needs the short g.page id
```

The cleanest CID-only option is to send users to the Maps listing via `?cid=` and rename the CTA to "Open our Google listing & leave a review". Slightly more friction (one extra click on "Write a review"), but avoids needing the Place ID.

## Recommendation

Go with **Option A**. One-click review flow stays intact, no code change, just swap the secret value. I'll need you to either:

1. Paste the real Place ID (starts with `ChIJ`), and I'll update the `GOOGLE_REVIEW_PLACE_ID` secret, **or**
2. Confirm Option B and I'll switch the edge function to the `cid=` URL using the value already stored.

Which do you want?  
  
  
I want number 1 and here is the info i found:  
  
  
AB Media Team  
**Place ID:** ChIJ50FDykeVuEcRrf2fjhu8za4  
Weseler Str. 73, 47169 Duisburg, Deutschland