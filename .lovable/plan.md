## What I found

Your boss is correct — the 08:00 UTC cron run on June 1st did NOT create invoices for all active contracts. Current state for "Juni 2026":

- **66** active contracts that should have been billed
- **49** got the email sent
- **46** got an invoice row created in `invoices`
- **17 contracts still have no June invoice** (and 3 of those even have `email_sent=true` but `invoice_id=NULL` — orphaned: email went out, invoice row never linked)

The 17 missing-invoice contracts include: Able Facility Solutions, Autohalle Buchholz, Autoland AG Reust, Aux Clefs des Sacres, Carstar AG, Carz And Dealz, Cleanteam Group, Falkirk Van Sales, Flurim Haustechnik, Isoconfort, Juwelier Gattinger, LogisGreen, Medpassion, N7 Auto Repairs, Premium Huis, Ra Autocenter, RDL Loodgieters, R.E. Immo, The Cube Utrecht, United Dance Utrecht.

### Why it happened

1. `generate-monthly-installments` (the 08:00 job) loops through **all 66 active contracts in a single edge-function invocation**, generating PDFs + Resend calls serialized per contract. It exceeded the Supabase edge function wall-clock limit and the invocation was killed mid-loop. The `monthly_cron_runs` row for 08:00 shows `status: running`, `finished_at: NULL`, `contracts_total: 0`.
2. The 09:00 `monthly-billing-catchup` only picks up rows where `email_sent=false AND payment_status='unpaid' AND due_date<=today`. It misses the 3 orphan rows where `email_sent=true` but `invoice_id IS NULL` (email succeeded but the invoice insert failed), so those never get retried.
3. Catchup was rate-limited by its own 500 ms delay, and Supabase edge functions still capped its total runtime, so it only worked through ~17 contracts before stopping.

## Plan

### 1. Restructure the 08:00 cron to DB-side fanout (root fix)

Change cron job `generate-monthly-installments` (jobid 3) so the SQL itself enumerates active contracts and fires **one `net.http_post` per contract** to the existing `generate-monthly-installments?contract_id=…&trigger=cron` endpoint. The edge function already supports per-contract invocations (the catchup uses this path successfully). Each invocation is short-lived and independent, so no single timeout can take down the whole batch.

The cron job command becomes:

```sql
SELECT net.http_post(
  url := 'https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/generate-monthly-installments?contract_id='
         || c.id || '&trigger=cron',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon>"}'::jsonb,
  body := '{}'::jsonb
)
FROM public.monthly_contracts c
WHERE c.status = 'active'
  AND c.start_date <= (now() AT TIME ZONE 'UTC')::date;
```

`pg_net` queues these asynchronously, so the cron itself returns immediately and each contract gets its own ~10–30 s function run.

### 2. Harden the catchup to also pick up orphans

Update `supabase/functions/monthly-billing-catchup/index.ts` so the "missed" set includes installments where `invoice_id IS NULL` even if `email_sent=true`. New query:

```ts
.or("email_sent.eq.false,invoice_id.is.null")
.eq("payment_status", "unpaid")
.lte("due_date", today)
```

Also fire the per-contract requests **without awaiting** (fire-and-forget loop) and drop the 500 ms delay — let `pg_net`-style parallelism happen at the function layer too, so a 60-contract catchup completes inside one invocation.

### 3. Immediate one-shot recovery for the 17 affected contracts

Before deploying #1/#2, manually re-trigger the 17 contracts so today's invoices are produced. For the 3 orphan rows (Autohalle Buchholz, Flurim Haustechnik, Medpassion) the function will skip them because `email_sent=true` already — so first reset those 3 rows:

```sql
UPDATE monthly_installments
SET email_sent = false, email_sent_at = NULL
WHERE contract_id IN (
  'c84b7688-114b-469f-aa51-495ec2d0cb58',
  '024c52d5-0a50-4b64-97dc-d40706d96796',
  'f7ab6de0-c9cd-4f31-a341-1853ed0d2a64'
)
AND month_label IN ('Juni 2026','June 2026')
AND invoice_id IS NULL;
```

Then `POST generate-monthly-installments?contract_id={id}&trigger=manual` for each of the 17 contracts (with a 1.5 s delay between calls so Resend stays under its 2/sec ceiling).

### 4. Verification

After running, re-check:

```sql
SELECT COUNT(*) AS total, COUNT(invoice_id) AS with_invoice
FROM monthly_installments mi
WHERE mi.month_label IN ('Juni 2026','June 2026')
  AND mi.contract_id IN (
    SELECT id FROM monthly_contracts WHERE status='active' AND start_date <= '2026-06-01'
  );
```

Expect `total = with_invoice = 66`.

## Files / DB touched

- `supabase/functions/monthly-billing-catchup/index.ts` — query + fire-and-forget loop
- `cron.job` row id 3 — command replaced (migration)
- One-shot `UPDATE` to clear 3 orphan rows + 17 manual edge-function calls

No changes to `generate-monthly-installments/index.ts` itself, no schema changes, no RLS changes, no team-notification changes.