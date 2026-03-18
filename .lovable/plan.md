

## Multi-Language Automated Invoice Payment Reminders

### Current State
The `send-invoice-payment-reminders` Edge Function sends automated reminder emails with **hardcoded English text** to clients. The system already has a `detectLanguageFromAddress` utility (used in Monthly Packages) and supports 10 languages for invoice templates.

### What Changes

**`supabase/functions/send-invoice-payment-reminders/index.ts`** — the only file that needs changes:

1. **Add language detection function** — port the same `detectLanguageFromAddress` logic (scanning `company_address` for country keywords like "Deutschland" → `de`, "Nederland" → `nl`, etc.)

2. **Add translated email content** — a translations object with all 10 supported languages containing:
   - Client-facing greeting text ("Dear {name}, this is a friendly reminder that your invoice is still pending payment")
   - Urgency labels ("Payment Reminder", "Payment Reminder Follow-Up", "Urgent Payment Reminder")
   - Section labels ("Amount Due", "Order Description")
   - Footer text
   - Subject line prefix

3. **Update `buildReminderEmailHtml`** — accept a `language` parameter, use translated strings instead of hardcoded English

4. **Update email subject lines** — use translated subject for client emails (team emails stay in English so the team always understands them)

5. **Detect language per invoice** — use `order.company_address` to detect language before building the email

### Supported Languages
English (default), German, Dutch, French, Spanish, Danish, Norwegian, Czech, Polish, Swedish — matching the existing system.

### Example
A client with address containing "Deutschland" will receive:
- Subject: `💰 Zahlungserinnerung #1: Rechnung INV-2026-001 - €399,99`
- Body: German text with "Sehr geehrte/r {name}, dies ist eine freundliche Erinnerung..."

The team copy stays in English so everyone on the team can read it.

