

## Add "Preview" Button to Offers

Add a small "Preview" button on each offer row in the actions column that opens the client-facing confirmation page (`/confirm-offer/{offerId}`) in a new browser tab.

### Changes

**`src/pages/Offers.tsx`** — 2 edits:

1. Add `ExternalLink` to the lucide-react import (line 32)
2. Add a Preview button in the actions `div` (after View, before Confirm — around line 308):

```tsx
<Button variant="ghost" size="sm" onClick={() => window.open(`/confirm-offer/${offer.id}`, '_blank')}>
  <ExternalLink className="h-4 w-4 mr-1" /> Preview
</Button>
```

This opens the exact same page the client sees when they click the offer link — so you can verify layout, pricing, and details before or after sending.

