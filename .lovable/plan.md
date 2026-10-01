# Fix duplicate `INV-INV` invoice numbers

## Goal
Show each invoice number only once in the invoice preview, downloaded PDF, and PDF attached to sent emails—for example, `INV-2026-1556`, never `INV-INV-2026-1556`.

## Confirmed cause
Saved invoice numbers already include `INV-`. The preview and PDF generator currently add the template prefix (`INV-`) again. The same PDF generator is used by direct downloads, Send to Client, monthly-package sending, and reminder attachments, so all of those paths can inherit the duplicate.

## Changes
- Add one shared invoice-number formatter that applies a configured prefix only when the number does not already begin with it.
- Use that formatter in both invoice title locations in the on-screen preview and both title locations in generated PDFs.
- Keep saved invoice numbers unchanged; this is a presentation-only correction.
- Preserve custom prefixes: a genuinely different configured prefix can still be shown, while an already-present prefix is never duplicated.

## Verification
- Add focused tests for a stored `INV-2026-1556` with the default `INV-` prefix, a number without a prefix, an empty prefix, and a custom prefix.
- Check preview, direct PDF download, Send to Client attachment, monthly invoice attachment, and reminder attachment all resolve to one correctly formatted number.
- Run the invoice tests and TypeScript checks, then confirm the preview build is healthy.
