## Diagnoza

Naručio sam stanje za "test GMBH" order `18704276-…`:
- `status_resolved = true` ✅
- `status_invoice_paid = true` ✅
- `contact_email = jusufprazina788@gmail.com` ✅
- `review_request_sent_at = NULL` ❌ (nikad nije obeleženo)

Edge function `send-review-request` je deployovana i radi (ručni test vraća 401 jer nema auth header — znači funkcija postoji), **ali u logovima funkcije NEMA NIJEDNOG poziva**. Znači klijent nikad nije pozvao funkciju.

### Uzrok

Trigger u `OrderService.toggleOrderStatus` koristi `enqueueNotification('send-review-request', ...)` koja:
1. Stavlja poziv u **in-browser red** (`src/utils/notificationQueue.ts`).
2. Procesira ga **serijski sa 8s pauzom** između svakih poziva.
3. Kada user toggluje "Invoice Paid" ili "Resolved", paralelno se queueuje i `send-status-change-notification` koji šalje 12 emailova jedan po jedan (≈90s). Review request se dodaje **na kraj reda**.
4. Ako user u međuvremenu **refreshuje stranicu, navigira ili zatvori tab**, queue se uništi i poziv nikad ne stigne.

Plus: ne postoji nikakav server-side fallback. Ako klijentski poziv padne, ništa nikad ne pošalje email.

## Plan popravke

### 1. Direktan poziv umesto queue-a (klijent)
U `src/services/orderService.ts` zameniti `enqueueNotification('send-review-request', ...)` sa direktnim `supabase.functions.invoke('send-review-request', { body: { orderId } })` fire-and-forget. Razlog: ova funkcija šalje samo **jedan** email klijentu (ne 12 timskih), nema rate-limit problem, i ne sme da čeka iza dugog status-notification reda.

### 2. Server-side fallback (DB trigger)
Dodati Postgres trigger `AFTER UPDATE ON orders` koji se okida kada `status_resolved` ILI `status_invoice_paid` pređu u true i `review_request_sent_at IS NULL`. Trigger preko `pg_net.http_post` poziva edge function sa service role headerom. Ovo garantuje slanje čak i ako klijent padne, refreshuje, ili je status menjan kroz cron/SQL.

Zahteva:
- Omogućiti `pg_net` ekstenziju (ako već nije).
- Sačuvati `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` u trigger funkciji kao secrets (preko `vault` ili hard-coded URL + role iz `current_setting`).
- Trigger samo enqueue-uje HTTP — async, ne blokira UPDATE.

### 3. Backfill za "test GMBH"
Ručno pozvati edge function za order `18704276-6788-4fa3-bfe6-11aae242566b` da se trenutno pošalje email i postavi `review_request_sent_at`.

### 4. Mali logging dodatak
U edge funkciji već postoji `console.log("Order not Resolved+Paid, skipping")` itd. — dovoljno za buduću dijagnostiku preko Edge Function logova.

## Šta se NE dira
- Postojeća logika `send-status-change-notification` i ostatak `enqueueNotification` reda (oni i dalje trebaju 8s pauze zbog Resend rate limita za 12-člani tim).
- HTML/multi-jezik sadržaj review emaila.
- Idempotentnost (`review_request_sent_at`) — već je čvrsta na server strani.