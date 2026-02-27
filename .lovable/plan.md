

## Cache Upsell Translations in Database

### Overview
Create a `upsell_translations` table to store completed translations. When a user selects a language, check the cache first — only call the AI if that upsell+language combo hasn't been translated yet. All users share the same cache.

### Changes

**1. Database — New `upsell_translations` table**

Migration to create:
- `id` (uuid, PK)
- `upsell_id` (uuid, FK → upsells.id ON DELETE CASCADE)
- `language` (text)
- `translated_text` (text)
- `created_at` (timestamptz)
- Unique constraint on `(upsell_id, language)`
- RLS: authenticated users can SELECT and INSERT

**2. Service — `src/services/upsellService.ts`**

Add two functions:
- `fetchCachedTranslation(upsellId, language)` — queries `upsell_translations` for existing entry
- `saveCachedTranslation(upsellId, language, translatedText)` — upserts into `upsell_translations`

Update `translateUpsellText` or add a wrapper that:
1. Checks cache first
2. If found, returns cached text (no AI call)
3. If not found, calls edge function, saves result, returns it

**3. Page — `src/pages/Upsell.tsx`**

Update `handleTranslate` to use the cache-aware flow:
1. Query `upsell_translations` for `(upsell_id, language)`
2. If cached → display immediately, no loading spinner needed
3. If not cached → call AI, save to DB, then display

No changes to the edge function itself.

