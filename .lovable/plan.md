## Goal

1. Re-trigger the two contracts that failed on June 1 so their client emails go out today.
2. Improve `generate-monthly-installments` so any future Resend failure stores the real error (HTTP status + Resend response body) in `monthly_cron_contract_results.error_detail`, instead of the generic "Resend client email failed" string.

## Part 1 — Retry the two failed contracts

Trigger the edge function once per failed contract via the existing per-contract entry point (same path the "Retry" button uses):

- Praxis Maintal – Dr. med. Fatma Kathenbach
  `contract_id = 6030c118-0e7b-4043-8e0b-159a9638c405`
- Nova Dance Utrecht
  `contract_id = 196a782b-5021-4529-a13c-30656ebe169e`

For each: `POST {functions-url}/generate-monthly-installments?contract_id={id}&trigger=manual` using the service role key, with a short delay between the two calls.

If the underlying cause was a bad recipient address, the retry will fail the same way — but now (after Part 2 is deployed) we'll see the exact reason in the run details.

## Part 2 — Capture real Resend error in `error_detail`

Single file: `supabase/functions/generate-monthly-installments/index.ts`.

1. Change `sendInvoiceEmail(...)` return type from `Promise<boolean>` to `Promise<{ ok: boolean; error?: string }>`:
   - On non-OK response: read the body once, return `{ ok: false, error: \`HTTP ${res.status}: ${body.slice(0, 500)}\` }`.
   - On thrown exception: return `{ ok: false, error: String(err?.message || err) }`.
   - On success: `{ ok: true }`.

2. Update both call sites (around lines 852 and 939):
   - Replace `const sent = await sendInvoiceEmail(...)` with `const result = await sendInvoiceEmail(...)`.
   - Replace `if (sent)` with `if (result.ok)`.
   - In each failure branch, pass `error_detail: result.error` into `logResult({...})` alongside the existing `reason: "Resend client email failed"`.

No changes to DB schema, RLS, or the team/notification path. No behavior change for successful sends.

## Verification

- After deploy: re-trigger both failed contracts (Part 1).
- Open Monthly Packages → Cron Run Status → Details. Failed rows will now show the actual Resend message (e.g. "HTTP 422: invalid `to` field" or "HTTP 403: domain not verified") instead of the generic string.
- Confirm `monthly_installments.email_sent` flips to true for the two affected June rows on success.
