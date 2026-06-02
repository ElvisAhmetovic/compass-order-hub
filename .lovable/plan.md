## Goal

Harden `toPdfSafe()` in `supabase/functions/generate-monthly-installments/index.ts` so any name/address/description rendered through jsPDF (helvetica / WinAnsi) is normalized first and never falls back to the UTF-16 path that corrupted INV-2026-854.

## Changes (single file: `supabase/functions/generate-monthly-installments/index.ts`)

Replace the current `toPdfSafe()` (lines ~492-502) with a stricter pipeline, and apply it to every user-provided text field passed to `doc.text(...)`.

### 1. Normalize first (NFKC)

```ts
s = s.normalize("NFKC");
```

- Collapses compatibility forms (full-width Latin, ligatures like `ﬁ`, superscripts, etc.) into their plain ASCII/Latin-1 equivalents where possible.
- Splits accented composed glyphs into base + combining marks so the next steps can handle them predictably.

### 2. Strip zero-width / bidi / control junk

Remove characters that are invisible but break jsPDF text width calc and selection:
- ZWSP / ZWNJ / ZWJ / WORD JOINER: `\u200B-\u200D`, `\u2060`, `\uFEFF` (BOM)
- LRM/RLM and bidi isolates: `\u200E`, `\u200F`, `\u202A-\u202E`, `\u2066-\u2069`
- Soft hyphen: `\u00AD`
- C0 controls except `\t \n \r`: `\u0000-\u0008`, `\u000B`, `\u000C`, `\u000E-\u001F`, `\u007F`
- C1 controls: `\u0080-\u009F`

### 3. Whitespace folding

- NBSP (`\u00A0`), narrow NBSP (`\u202F`), figure space (`\u2007`), thin/hair/en/em spaces (`\u2002-\u200A`), ideographic space (`\u3000`) → regular space.
- Tabs → single space (PDF line; keep newlines for address line breaks since `splitTextToSize` handles them).
- Collapse runs of spaces to one.

### 4. Punctuation normalization (extends current)

- Hyphens/dashes/minus: `\u2010-\u2015`, `\u2212`, `\u00AD` → `-`
- Quotes: `\u2018\u2019\u201A\u201B\u2032` → `'`; `\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB` → `"`
- Ellipsis `\u2026` → `...`
- Bullets `\u2022\u2023\u25E6\u2043` → `*`
- Middle dot `\u00B7` → `.`
- Multiplication / division kept as-is (they're Latin-1).

### 5. After NFKC, recompose then strip remaining combining marks for glyphs that don't have a Latin-1 precomposed form

```ts
s = s.normalize("NFC");
// strip stray combining marks that didn't recompose (e.g. behind non-Latin base)
s = s.replace(/\p{M}/gu, "");
```

This keeps `é à ü ß ñ ç` (all in Latin-1, fine for helvetica) while removing decorative combining marks that would otherwise trigger the UTF-16 fallback.

### 6. Last-resort transliteration for common non-Latin-1 European letters

A small map covers the realistic CRM client set (Polish, Czech, Slovak, Hungarian, Romanian, Turkish) before the `?` fallback:

```
ąĄ→a/A, ćĆ→c/C, ęĘ→e/E, łŁ→l/L, ńŃ→n/N, śŚ→s/S, źŹżŻ→z/Z,
čČ→c/C, ďĎ→d/D, ěĚ→e/E, ňŇ→n/N, řŘ→r/R, šŠ→s/S, ťŤ→t/T, ůŮ→u/U, žŽ→z/Z,
őŐűŰ→o/O,u/U,
șȘşŞ→s/S, țȚţŢ→t/T, ăĂ→a/A, ıİ→i/I, ğĞ→g/G, ŞŠ→S, ĵĴ→j/J,
œŒ→oe/OE, æÆ→ae/AE  // already Latin-1 except œŒ
```

### 7. Final guard

Any remaining codepoint > `0xFF` → `?`. So even an emoji or CJK glyph pasted into a client name can never poison a whole line again.

### 8. Apply everywhere user data hits `doc.text`

Re-audit `generateInvoicePDF()` and pipe through `toPdfSafe`:
- `safeName`, `safeAddress`, `safeEmail`, `safeDescription` (already wrapped)
- Also wrap any other user/company-derived strings if present in this function (none expected from the company constants since those are ASCII, but the helper is idempotent and cheap so it's fine to add defensively where strings come from DB).

### 9. Keep existing wrap/layout fixes

No change to `splitTextToSize` recipient wrap or the right-side details block — they stay as in the previous fix.

## Out of scope

- Switching jsPDF to a Unicode TTF font (Noto Sans). Adds ~300KB to the edge function; current transliteration covers every script the CRM actually sees.
- Re-rendering historic bugged PDFs.
- Touching the HTML email body (not affected by this bug).
- Any other edge function or frontend PDF generator (`src/utils/invoicePdfGenerator.ts` uses a different path; not in this request).

## Files touched

- `supabase/functions/generate-monthly-installments/index.ts` (only — replace the `toPdfSafe` helper, no other logic changes).
