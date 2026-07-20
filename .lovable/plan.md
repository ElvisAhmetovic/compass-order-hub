## Goal
Change the company name shown on generated invoice/proposal PDFs from **"AB MEDIA TEAM"** to **"AB MEDIA TEAM LTD"**.

## Where the name comes from
Invoice + proposal PDFs render `companyInfo.name`, which is loaded from `public.company_settings` for the signed-in user, falling back to hard-coded defaults when no row exists (which is the case for most admins — only 1 row exists today, and it belongs to "Selmin Huzbasic", not the AB Media Team default).

So the actual on-PDF value for the boss and every other admin comes from the code-level defaults, not the DB.

## Changes (frontend/PDF defaults only)
1. `src/services/companySettingsService.ts` — `DEFAULT_COMPANY_INFO.name`: `"AB MEDIA TEAM"` → `"AB MEDIA TEAM LTD"`.
2. `src/utils/proposal/companyInfo.ts` — `DEFAULT_COMPANY_INFO.name`: same rename (drives invoice PDF + proposal PDF fallbacks).
3. `src/utils/proposal/pdfGenerator.ts` — both inline fallbacks `companyInfo.name || 'AB MEDIA TEAM'` → `'AB MEDIA TEAM LTD'`.
4. `supabase/functions/generate-monthly-installments/index.ts` — the two hard-coded `"AB MEDIA TEAM"` strings (default company object + PDF header `doc.text`) → `"AB MEDIA TEAM LTD"`, then redeploy the function.

## Explicitly out of scope (unchanged)
- Email body sign-offs, sender identities ("AB Media Team <noreply@abm-team.com>"), sidebar title, and translation templates — these are the brand/team display name, not the legal company name on invoices. If you want those renamed too, say the word and I'll extend the change.
- The one existing `company_settings` row (name = "Selmin Huzbasic") — it's a different user's custom setting, not the AB Media Team default, so I'll leave it alone.

## Verification
After the edits: build passes, and a freshly generated invoice PDF (via preview) shows "AB MEDIA TEAM LTD" in the header for any admin without a custom `company_settings` row.
