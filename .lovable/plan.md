

## Send Exact Offer Email Copy to Team

Currently the `send-offer-email` Edge Function only sends the branded offer email to the client. The team never sees the actual email design. This change will also send the exact same HTML email to all 12 team members so everyone can see exactly what the client received.

### Changes

**`supabase/functions/send-offer-email/index.ts`** — After successfully sending to the client, fire-and-forget send the same HTML to all team members in batches (2 per batch, 1s delay) to respect Resend rate limits.

The team copy will:
- Use the exact same HTML template (identical to what the client sees)
- Have a slightly modified subject: `[Team Copy] Your Offer from AB Media Team – {companyName}`
- Be sent in batches of 2 with 1-second delays to avoid rate limits
- Be fire-and-forget (won't block the client response)
- Use the same `RESEND_API_KEY_ABMEDIA` and `noreply@abm-team.com` sender

The team email list is hardcoded in the function (same 12 addresses used across the system).

### Also remove the Preview button

Since the team will now receive the actual email, the Preview button added to the Offers page is no longer needed and will be removed from `src/pages/Offers.tsx`.

### Technical detail

```text
Client email sent
  ↓ (success)
Fire-and-forget background task:
  → Batch 1: emails[0], emails[1]  → 1s delay
  → Batch 2: emails[2], emails[3]  → 1s delay
  → ... until all 12 sent
```

### Files to modify
1. `supabase/functions/send-offer-email/index.ts` — Add team copy sending after client send
2. `src/pages/Offers.tsx` — Remove Preview button and `ExternalLink` import

