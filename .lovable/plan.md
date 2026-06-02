## Which invoice is bugged

**INV-2026-854** — Villa Miramar Frontignan Luis‑Mickaël Zaragoza, 125,00 €, June 2026 monthly installment (invoice id `915e05fe-ca50-45b6-81e0-776f83569918`).

Same client also has older invoices INV-2026-666 (May) and INV-2026-520 (April) that very likely have the same corruption, plus any other client whose name/address contains characters outside Latin‑1.

## Why it got bugged

The recipient name is rendered as `&V&i&l&l&a& &M&i&r&a&m&a&r& &L&u&i&s&...` — every letter prefixed with `&`. That's not a data problem in the database (the name is stored cleanly: `Villa Miramar Frontignan Luis‑Mickaël Zaragoza`), it's a PDF encoding problem.

Root cause is in `supabase/functions/generate-monthly-installments/index.ts` → `generateInvoicePDF()`:

- It uses **jsPDF with the built-in `helvetica` font**, which only supports **WinAnsi / Latin‑1** characters.
- The client name contains `‑` (U+2011, NON‑BREAKING HYPHEN, between "Luis" and "Mickaël"). U+2011 is **not** in WinAnsi.
- When jsPDF hits a character outside WinAnsi while still in a single `doc.text(...)` call, it falls back to a UTF‑16 escape path for the whole string. The PDF viewer then renders each codepoint as a 2‑byte pair, which displays as the garbled `&letter&letter&...` pattern visible in the screenshot.
- Address fields with German `ß`, Czech/Slovak/Polish/French diacritics, em‑dashes (`–`, `—`), curly quotes, etc. will trigger the exact same bug.

A second, smaller issue is visible in the same image: the long client name overflows into the right‑aligned `Invoice Number` block (`Invoice Number: INV-2026-854` is overlapped by the name). That's a layout bug, not an encoding one — but it's worth fixing in the same pass since it's the same code path.

## The fix

Edit only the monthly PDF generator: `supabase/functions/generate-monthly-installments/index.ts`.

1. **Sanitize text before `doc.text(...)`** — add a small `toPdfSafe(s)` helper used for every `doc.text` call that prints client / address / description data:
   - Replace `‑` (U+2011), `‒`, `–`, `—`, `−` → `-`
   - Replace `‘ ’ ‚ ‛` → `'` and `“ ” „ ‟` → `"`
   - Replace `…` → `...`, `•` → `*`, `\u00A0` (NBSP) → regular space
   - Final fallback: any remaining char with codepoint > 0xFF gets replaced with `?` (so one stray glyph can never corrupt the whole line again).
2. **Wrap long recipient name + address** so they don't run under the right‑side invoice details block:
   - Compute a safe `recipientMaxWidth = (pageWidth - marginRight) - marginLeft - 70` (~70 mm reserved for the right block).
   - Use `doc.splitTextToSize(toPdfSafe(clientName), recipientMaxWidth)` and advance `y` per line.
   - Do the same for `clientAddress`.
3. **Re‑position the right‑aligned details block** to start at the same `y` as the recipient label (not `y - 22`), so it's predictable regardless of how many wrapped recipient lines were drawn.
4. **No DB / schema / RLS / cron changes.** Existing already‑sent bugged PDFs (854, 666, 520) stay in clients' inboxes — the user can manually re‑send any of them from `/monthly-invoice-status` once this fix is deployed; the regenerated PDF will be clean.

## Out of scope

- Switching jsPDF to a Unicode TTF font (e.g. embedding Noto Sans). That would be the "real" fix but adds ~300 KB to the edge function and changes the visual style; the sanitize + replacement approach is enough for the character set this CRM actually sees (EU Latin scripts).
- Re‑rendering the bugged historic PDFs automatically.
- Any change to the HTML email body (it uses normal HTML rendering, not jsPDF, so it doesn't have this bug).

## Files touched

- `supabase/functions/generate-monthly-installments/index.ts` (only)
