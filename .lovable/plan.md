

## Add Upsell Management Module with AI-Powered Translation

### Overview

Build a new "Upsell" page accessible from the sidebar. It stores sales pitches/upsell scripts in an accordion layout, with per-item AI-powered translation using Lovable AI (via the already-available `LOVABLE_API_KEY`) and clipboard copy. Data persists in Supabase.

### Changes

**1. Database — Create `upsells` table**

New migration with columns: `id` (uuid), `title` (text), `description` (text), `created_by` (uuid), `created_at`, `updated_at`. RLS policies for authenticated users to read all and manage their own.

**2. Edge Function — `translate-upsell/index.ts`**

A new edge function that:
- Accepts `{ text: string, targetLanguage: string }`
- Calls the Lovable AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with `LOVABLE_API_KEY`
- System prompt: "Translate the following text to {language}. Return only the translated text, nothing else."
- Returns `{ translatedText: string }`
- Non-streaming (simple invoke)
- Handles 429/402 errors

**3. Sidebar — `src/components/dashboard/Sidebar.tsx`**

Add a new menu item: `{ href: '/upsell', icon: TrendingUp, label: 'Upsell', roles: ['admin', 'agent'] }` — placed after Proposals.

**4. Router — `src/App.tsx`**

Add route: `/upsell` → `<RequireAuth><Upsell /></RequireAuth>`

**5. Page — `src/pages/Upsell.tsx`**

- Uses `Layout` wrapper
- "Add Upsell" button opens a Dialog with Title + Description (textarea) fields
- Lists all upsells in an Accordion (title expands to show description)
- Each item has:
  - Language dropdown (English, Spanish, French, German, Dutch, Czech, Swedish, Norwegian, Danish)
  - When a language is selected, calls the `translate-upsell` edge function and displays the translated text inline (with loading state)
  - "Copy" button copies the currently displayed text to clipboard (with toast confirmation)
- State: each item tracks its own selected language and translated text independently
- Data fetched via React Query from Supabase `upsells` table

**6. Service — `src/services/upsellService.ts`**

CRUD functions for the `upsells` table (fetch all, create, delete).

### Technical Notes

- Translation uses Lovable AI (Gemini Flash) — no external API keys needed, uses the pre-provisioned `LOVABLE_API_KEY`
- Each upsell item maintains independent translation state so changing one doesn't affect others
- Translations are fetched on-demand (not cached) to keep it simple

