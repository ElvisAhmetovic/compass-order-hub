

# "Service Delivered" Automatic Email on Resolved Status

## Overview

When a team member sets an order's status to **Resolved**, the system will automatically send a professional German-language email to the order's `contact_email` (not just linked portal clients). The email informs the client that the service is delivered, includes a live link to verify the work, the invoice details, and two action options: "Everything OK" or "Report a Problem" (which creates a new complaint ticket in the system).

## What Changes

### 1. New Edge Function: `send-service-delivered-notification`

A new Supabase Edge Function that sends the formal German email template you specified. It will:

- Accept the order ID and triggering user info
- Look up the order details (company name, price, description, contact email, company link)
- Look up any linked invoice (invoice number, amount, download link)
- Build the German email template with all dynamic placeholders:
  - `{customer_name}` -- from `company_name` or `contact_person` on the order/company
  - `{ticket_id}` -- the order ID (shortened)
  - `{service_name}` -- from the order `description`
  - `{invoice_number}` -- from linked invoice if exists
  - `{invoice_amount}` -- formatted in EUR with de-DE locale (comma separator)
  - `{invoice_link}` -- link to invoice in the client portal (or dashboard)
  - `{service_live_link}` -- from the order's `company_link` field (Google Maps, Trustpilot, etc.)
  - `{ticket_reply_link}` -- a deep link to the client support page to open a complaint
  - `{today_date}` -- formatted as dd.MM.yyyy
- Send via Resend using `RESEND_API_KEY_ABMEDIA` from `noreply@empriadental.de`
- Log the email in `client_email_logs` for audit trail

### 2. Trigger: Hook into `toggleOrderStatus` for "Resolved"

In `src/services/orderService.ts`, inside the `toggleOrderStatus` method (around line 670-694), add a new block that fires **only when status "Resolved" is enabled**:

- Calls the new edge function via `supabase.functions.invoke('send-service-delivered-notification', ...)`
- Sends to the order's `contact_email` (works for ALL orders, not just those with `client_id`)
- Falls back to the existing generic client notification for portal-linked clients

### 3. Complaint Link Flow

The "Ich habe ein Problem" button in the email will link to:
- **If order has `client_id`**: `{APP_URL}/client/support?complaint=true&orderId={orderId}` -- opens the client portal support page with a pre-filled complaint form
- **If no portal account**: `mailto:service@team-abmedia.com?subject=Einwand zu Auftrag {orderId}` -- fallback to email

On the client support page (`ClientSupport.tsx`), we will read the `complaint` and `orderId` query parameters and auto-open the "New Inquiry" dialog pre-populated with:
- Subject: "Einwand / Complaint - {company_name}"
- The linked order pre-selected
- Focus on the message field

### 4. Email Template (German)

Exactly as you specified:

**Subject:** `Dienstleistung abgeschlossen -- Bitte prufen & Rechnung begleichen (AB MEDIA TEAM)`

**Body:** Your full German template with all placeholders dynamically filled.

Two action buttons:
- "Alles in Ordnung" -- no action needed, just a confirmation text
- "Ich habe ein Problem" -- links to the complaint form

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/send-service-delivered-notification/index.ts` | **Create** | New edge function with German email template |
| `src/services/orderService.ts` | **Modify** | Add call to new edge function when "Resolved" is toggled on (lines ~670-694) |
| `src/pages/client/ClientSupport.tsx` | **Modify** | Read `complaint` + `orderId` query params, auto-open complaint dialog |

## Technical Details

### Edge Function Structure

```
send-service-delivered-notification
  Input: { orderId, changedBy: { id, name } }
  Process:
    1. Fetch order (company_name, contact_email, company_link, price, description)
    2. Fetch linked invoice (if exists) for invoice_number and amount
    3. Build German HTML email with all placeholders
    4. Send via Resend to contact_email
    5. Log in client_email_logs
  Output: { success, emailId }
```

### Order Service Integration

Inside `toggleOrderStatus`, after the existing client notification block (~line 694), add:

```
if (enabled && status === 'Resolved' && currentOrder.contact_email) {
  // Send "Service Delivered" formal email to order's contact email
  await supabase.functions.invoke('send-service-delivered-notification', {
    body: { orderId, changedBy: { id: user.id, name: ... } }
  });
}
```

### Client Support Auto-Open

On mount, `ClientSupport.tsx` checks URL params:
- `?complaint=true&orderId=xxx`
- If present: opens the new inquiry dialog, pre-selects the order, sets subject to complaint format

## What This Does NOT Include (Future Phases)

- **Sales CRM integration / tagging** ("SERVICE_DELIVERED" tag, pipeline stage changes) -- this requires a CRM system integration that doesn't currently exist in Empria
- **"Alles in Ordnung" tracking** -- the "everything OK" button is informational only (no server action); could be added later as a confirmation endpoint

