
# Plan: Pouzdaniji automatski monthly billing

## Problem

Cron `generate-monthly-installments` radi 1. u mjesecu u 08:00 UTC i u bazi je oba puta vraćen status `succeeded`. Ali u praksi neki ugovori ne dobiju email odmah (npr. Baab-e-Salaam Mai 2026 → email tek 5.5.). Razlog je što edge function obrađuje 12+ ugovora **serijski**, a po svakom radi: createInvoice → generateInvoicePDF (jsPDF) → Resend slanje klijentu → 12× Resend slanja timu. Dovoljno je da se jedan Resend rate-limit ili PDF iznimka pojavi pa preostali ugovori u istom run-u budu preskočeni do sljedećeg trigger-a, a nemamo nikakav trag gdje je palo.

## Cilj

1. Da se **svi aktivni ugovori** sigurno obrade svakog 1. u mjesecu, bez obzira kad su kreirani.
2. Da imamo jasan trag (success/failure/skip + razlog) za svaki ugovor i svaki run.
3. Da u UI-ju (Monthly Packages stranica) vidimo zadnji cron run i možemo ručno re-trigger-ati za propušteni ugovor.

## Promjene

### 1. Nova tabela `monthly_cron_runs` (audit log)

```
id, started_at, finished_at, trigger ('cron'|'manual'),
contracts_total, processed, invoices_created,
client_emails_sent, team_emails_sent,
errors_count, status ('running'|'completed'|'failed'),
notes (text)
```

I tabela `monthly_cron_contract_results` (per-contract per-run):

```
id, run_id, contract_id, month_label,
status ('sent'|'skipped'|'failed'|'already_sent'),
reason (text), invoice_id, error_detail
```

RLS: čitanje samo za adminе, write preko service role iz edge function.

### 2. Refactor `generate-monthly-installments`

- Insert row u `monthly_cron_runs` na startu, update na kraju.
- Per ugovor: try/catch koji **ne prekida** loop, već loguje rezultat u `monthly_cron_contract_results`.
- Email tim notifikacijama: pomeri u **drugi pass**, sa malim delay-om (Resend 2/sec) — sprečava da team-email rate-limit obori klijent-email loop.
- Dodaj eksplicitni `await` između Resend poziva (200–500ms) da se izbegne 429.
- Dodaj `?contract_id=...` query param: kada je prosljeđen, obradi samo taj ugovor (za manual retry iz UI).

### 3. Dnevni "catch-up" cron

Dodatni cron koji se izvršava **svaki dan u 09:00 UTC** i traži:

```
SELECT * FROM monthly_installments
WHERE due_date <= CURRENT_DATE
  AND email_sent = false
  AND payment_status = 'unpaid'
```

Za svaki nađeni red trigger-uje `generate-monthly-installments?contract_id=X`. Ovo garantuje da se nikad ne propusti email — ako 1. dan padne, drugi dan će biti pokušan opet.

### 4. UI: status panel na Monthly Packages

Iznad tabele, mali blok sa:
- "Last run: 1.5.2026 08:00 — 11/12 contracts emailed (1 failed)"
- "Next scheduled: 1.6.2026 08:00"
- Dugme "Run now" (samo admin) → pokreće edge function manualno.
- Klik na "1 failed" otvara dijalog sa listom ugovora gde je palo + razlog + dugme "Retry".

### 5. Manual retry iz postojećeg per-installment Mail dugmeta

Već postoji `SendMonthlyInvoiceDialog` (po installmentu). Ostaje kao i do sada za ručno slanje pojedinačnih instalmenta.

## Tehnički detalji

- **Edge function timeout**: Supabase edge functions imaju 150s wall-time. Sa 12 ugovora × ~3-5s (PDF + 13 email-ova) = sada ~50-60s. Dodavanjem 200ms delay-a između Resend poziva ostaje ispod limita do ~25 ugovora. Ako lista naraste, rješenje je batched async invocation (van scope-a sad).
- **Tim emailovi**: trenutno se 12 zasebnih Resend poziva radi serijski po ugovoru → 144 poziva/min za 12 ugovora = preko Resend limita (100/sec ali burst). Refactor: jedan Resend poziv sa `bcc` listom umjesto loop-a → 1 poziv po ugovoru.
- **Idempotentnost**: zadržavamo postojeću provjeru `email_sent` flag-a — neće slati duplikate ako je već poslan.

## Out of scope

- Migracija na pgmq queue (overkill za 12-50 ugovora).
- Promjena predloška email-a / PDF-a.
- Multi-currency promjene.

## Šta korisnik dobija

- Nikad više "zaboravljeni" ugovor — catch-up cron uhvati propušteno sljedeći dan.
- Vidljivost: tačno znamo koji ugovor je dobio email i kad.
- Manual override: dugme "Run now" + retry po ugovoru bez čekanja sljedećeg mjeseca.
