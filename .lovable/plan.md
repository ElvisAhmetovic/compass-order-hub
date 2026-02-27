

## Restructure "Upsell" into Categorized "Text" Library

### Database Changes

**New table: `upsell_categories`**
- `id` (uuid, PK, default gen_random_uuid())
- `name` (text, NOT NULL)
- `created_by` (uuid, NOT NULL)
- `created_at` (timestamptz, default now())
- RLS: authenticated can SELECT, INSERT, DELETE

**Modify `upsells` table**: Add `category_id` (uuid, FK → upsell_categories.id ON DELETE CASCADE, nullable for backward compat)

### Sidebar Change

**`src/components/dashboard/Sidebar.tsx`** — Rename label from `'Upsell'` to `'Text'` and update icon to `Type` (from lucide). Change href to `/text`.

### Route Change

**`src/App.tsx`** — Change `/upsell` route to `/text`, keep same component import (renamed file).

### Service Layer

**`src/services/upsellService.ts`** — Add:
- `fetchCategories()` — SELECT from `upsell_categories`
- `createCategory(name, userId)` — INSERT
- `deleteCategory(id)` — DELETE (cascades to upsells + translations)
- `fetchUpsellsByCategory(categoryId)` — SELECT from `upsells` WHERE `category_id = X`
- `createUpsell` — updated to accept `categoryId` param

### Page Rewrite

**`src/pages/Upsell.tsx`** (rename to `src/pages/TextLibrary.tsx`):

Two views controlled by state (`selectedCategoryId`):

**Category List View** (when no category selected):
- Header: "Text Library" with "+ Add Category" button (top-left)
- Grid of category cards, each showing name + delete button (with AlertDialog confirmation)
- Click card → sets `selectedCategoryId`

**Category Detail View** (when category selected):
- Back button → clears `selectedCategoryId`
- Header: category name + "+ Add Text" button
- Accordion list of upsell items (same as current: title/description, translate dropdown, copy, delete)
- Translation caching logic preserved exactly as-is

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `upsell_categories`, add `category_id` to `upsells` |
| `src/services/upsellService.ts` | Add category CRUD + update upsell CRUD |
| `src/pages/Upsell.tsx` → `src/pages/TextLibrary.tsx` | Full rewrite with two-view layout |
| `src/components/dashboard/Sidebar.tsx` | Rename to "Text", change href/icon |
| `src/App.tsx` | Update route path and import |

