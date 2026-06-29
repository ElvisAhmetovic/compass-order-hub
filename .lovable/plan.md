## Cilj
Kad order dobije **i Resolved i Invoice Paid** statuse, automatski poslati klijentu email sa linkom za Google recenziju. Šalje se samo jednom po order-u.

## Implementacija

### 1. Place ID konfiguracija
- Dodati kolonu `google_review_place_id` (TEXT) u `company_settings` tabelu.
- Mali admin UI u Settings stranici (input + save), vidljiv samo admin-ima.
- Razlog za `company_settings` umesto secret: lako menjanje bez deploy-a, i podržava više brendova/kompanija u budućnosti.
- Review URL: `https://search.google.com/local/writereview?placeid={PLACE_ID}`

### 2. Tracking
- Nova kolona u `orders`: `review_request_sent_at TIMESTAMPTZ` — sprečava duplo slanje.

### 3. Edge function: `send-review-request`
- Input: `{ orderId }`.
- Učitava order + linked client (ime, email, jezik) + company_name.
- Učitava Place ID iz `company_settings`. Ako fali, loguje i izlazi (no-op).
- Provera: ako `review_request_sent_at` nije null → skip.
- Šalje preko **Resend** (`RESEND_API_KEY_ABMEDIA`) sa sender-om `invoice@team-abmedia.com` (već postojeća integracija u sistemu).
- HTML email sa:
  - Personalizovan pozdrav (Hi {ime})
  - Multi-jezik (DE/EN/FR/IT/ES/IT) — koristi `emailTranslationService` pattern već u sistemu
  - Veliko CTA dugme **"Leave a Google Review ⭐"** → review URL
  - Brand footer (AB Media Team)
- Nakon uspeha:
  - Update `orders.review_request_sent_at = now()`
  - Insert log u `client_email_logs` sa `email_type: 'review_request'`

### 4. Trigger u workflow-u (Resolved + Invoice Paid)
- U `OrderService.toggleOrderStatus`: nakon svake izmene statusa proveri:
  ```
  if (order.status_resolved && order.status_invoice_paid && !order.review_request_sent_at && order.client_id)
    → enqueueNotification('send-review-request', { orderId })
  ```
- Isto i u `WorkflowService.handlePaymentReceived` i `handleComplaintResolved` (samo kao centralizovani helper `maybeSendReviewRequest(order)` da se ne ponavlja).
- Fire-and-forget preko `enqueueNotification` (već postoji `8s` queue).
- Toast: `"📧 Google review request sent to client."` (samo ako je trigger ovog puta poslao).

### 5. Bez manual dugmeta
Po dogovoru — samo automatika, bez UI buttona.

## Tehnički detalji
- **DB migracije**: dodaju se 2 polja (`company_settings.google_review_place_id`, `orders.review_request_sent_at`).
- **Idempotentnost**: kombinacija `review_request_sent_at` kolone + provera na ulazu edge funkcije.
- **Failure handling**: ako edge fn padne, `review_request_sent_at` ostaje null pa će sledeća status izmena ponovo pokušati (do uspeha).
- **Throttle**: već imamo 8s queue delay u `enqueueNotification`.

## Šta neće biti dirano
- Postojeća `Resolved` automatika (service-delivered email itd.) ostaje netaknuta — review email je dodatak.
- Bez izmena na `client_email_logs` schemi (samo nov `email_type` string).