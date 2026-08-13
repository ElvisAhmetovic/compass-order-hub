# Point link previews at empriatech.com

QA confirmed the new preview (title, description, AB Media Team logo) is live on both the published URL and `https://www.empriatech.com/confirm-offer/<id>`. One remaining detail: `og:url` and the canonical link still point at `compass-order-hub.lovable.app`, while the links you actually send clients are on empriatech.com. Some crawlers attribute the preview to the URL in `og:url` rather than the shared link.

## Change

In `index.html`:
- `og:url` -> `https://www.empriatech.com/`
- `<link rel="canonical">` -> `https://www.empriatech.com/`

Nothing else changes: title, description, `og:image`, and the Twitter card tags stay exactly as they are.

## After it goes live

Frontend changes need a publish to take effect. Because WhatsApp caches previews, re-scrape the link once in Facebook's sharing debugger to clear the old cached card.
