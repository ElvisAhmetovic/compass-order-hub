

## Add Company Name, Phone & Invoice to Payment Reminder Cards

The `client_email_logs` table already stores `company_name` and `invoice_number`, but is missing `contact_phone`. The component doesn't display company name explicitly.

### Changes

**1. Database migration** — Add `contact_phone TEXT` column to `client_email_logs`

**2. `supabase/functions/send-client-payment-reminder/index.ts`** — Add `contact_phone: contactPhone || null` to the insert into `client_email_logs` (line ~396-409)

**3. `src/components/orders/PaymentRemindersSentTab.tsx`** — Add to the details grid:
- Company name row (Building icon) — already in data, just not displayed
- Phone number row (Phone icon) — from new `contact_phone` column
- Invoice number is already shown but will remain as-is

Update the interface to include `contact_phone: string | null`.

### Files Changed

| File | Change |
|------|--------|
| Migration | Add `contact_phone` column to `client_email_logs` |
| `supabase/functions/send-client-payment-reminder/index.ts` | Log `contact_phone` field |
| `src/components/orders/PaymentRemindersSentTab.tsx` | Display company name, phone, invoice in each card |

