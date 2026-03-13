

## Add Language & Region Settings to Client Portal

### Overview
Add a full i18n (internationalization) system to the client portal so clients can switch between **English, German, Dutch, French, and Swedish**. The language preference is stored in the database and applied across all client portal pages, sidebar, and header.

### Architecture

```text
┌─────────────────────────────────┐
│  profiles table                 │
│  + preferred_language (text)    │  ← stores 'en', 'de', 'nl', 'fr', 'sv'
└──────────┬──────────────────────┘
           │
  ┌────────▼─────────┐
  │ ClientLanguage    │  ← React Context providing t() function
  │ Context           │     and current language
  └────────┬─────────┘
           │
  ┌────────▼──────────────────────┐
  │ Translation dictionaries      │
  │ src/i18n/client-translations/ │
  │   en.ts, de.ts, nl.ts,       │
  │   fr.ts, sv.ts               │
  └───────────────────────────────┘
```

### Database
- Add `preferred_language text default 'en'` column to `profiles` table via migration.

### Translation System
Create `src/i18n/clientTranslations.ts` with a flat key-value dictionary per language covering all client portal UI strings (~80-100 keys). Categories include:
- **Navigation**: Dashboard, Orders, Invoices, Support, Settings
- **Dashboard**: Welcome messages, stat card titles, section headers
- **Orders**: column headers, status labels, empty states
- **Settings**: section titles, form labels, buttons
- **Support**: form labels, status labels
- **Header**: Welcome greeting, Logout
- **Common**: Loading, Error, Save, Cancel, Progress, etc.

### Context Provider
Create `src/context/ClientLanguageContext.tsx`:
- Reads `preferred_language` from the user's profile on mount
- Provides `t(key)` function that looks up the current language dictionary
- Provides `language` and `setLanguage()` (which also persists to profiles table)
- Wrap inside `ClientLayout` so it's available to all client pages

### Settings Page Update
Add a new "Language & Region" card in `ClientSettings.tsx`:
- Dropdown/select with 5 language options, each showing a flag emoji + language name in its native form (e.g., 🇩🇪 Deutsch, 🇳🇱 Nederlands)
- On change, saves to DB and updates context immediately

### Files to Update with `t()` calls
All client portal components need their hardcoded English strings replaced with `t('key')`:
- `ClientSidebar.tsx` — nav item titles
- `ClientHeader.tsx` — welcome text, logout
- `ClientDashboard.tsx` — all headings, stat titles, empty states
- `ClientOrders.tsx` — headings, table headers, empty states
- `ClientOrderDetail.tsx` — labels, section headers, buttons
- `ClientOrderCard.tsx` — progress label, file count text
- `ClientInvoices.tsx` — headings, placeholder text
- `ClientSupport.tsx` — headings, form labels, buttons
- `ClientSettings.tsx` — section titles, labels, buttons
- `clientStatusTranslator.ts` — status labels (pass language parameter)
- `AuthContext.tsx` — include `preferred_language` in user state

### Implementation Approach
1. Migration + update AuthContext to fetch/expose `preferred_language`
2. Create translation dictionaries (all 5 languages)
3. Create `ClientLanguageContext` with `t()` helper
4. Add language selector to Settings page
5. Replace all hardcoded strings across client portal components

### Scope
This only affects the **client portal** (`/client/*` routes). The admin/team dashboard stays in English.

