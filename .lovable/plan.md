

## Add Bank Payment Details to All Payment Reminder Emails

### Summary
Add the Belgium and Germany bank account details to all 4 payment reminder edge functions so clients (and the team) can see exactly where to pay.

### Bank Details Block (HTML)
A styled card with both accounts, matching the existing email design (rounded cards, clean table layout). Will be inserted before the footer in each email template.

### Edge Functions to Update

**1. `supabase/functions/send-client-payment-reminder/index.ts`**
- Add bank details HTML block to `getDefaultEmailHtml()` — insert after the "Need assistance?" box (line ~150), before the closing thanks
- Add the same block inside `wrapTemplateInEmailWrapper()` — append before the footer so custom templates also get bank details

**2. `supabase/functions/send-invoice-payment-reminders/index.ts`**
- Add bank details to `buildReminderEmailHtml()` — insert a new section after the Order Description card and before the Footer (line ~266). Only show for `isClientEmail: true` OR show for both (team sees it too for reference)

**3. `supabase/functions/send-order-payment-reminders/index.ts`**
- Add bank details block to the email HTML — insert after the reminder note box and before the "View Order Details" button (line ~174)

**4. `supabase/functions/send-payment-reminder/index.ts`**
- Add bank details block after the email body content div and before the footer div (line ~150)

### Bank Details HTML (shared across all)
```html
<div style="background:#f0f7ff; padding:20px; border-radius:12px; border:1px solid #d2e3fc; margin:20px 0;">
  <h3 style="margin:0 0 15px; color:#1a73e8; font-size:16px;">🏦 Payment Information</h3>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td colspan="2" style="font-weight:bold; padding:8px 0 4px; color:#202124;">Bankrekening België</td></tr>
    <tr><td style="color:#5f6368; padding:3px 0;">IBAN:</td><td style="color:#202124;">BE79967023897833</td></tr>
    <tr><td style="color:#5f6368; padding:3px 0;">BIC:</td><td style="color:#202124;">TRWIBEB1XXX</td></tr>
    <tr><td style="color:#5f6368; padding:3px 0;">BLZ:</td><td style="color:#202124;">967</td></tr>
    <tr><td style="color:#5f6368; padding:3px 0;">Konto:</td><td style="color:#202124;">967023897833</td></tr>
    <tr><td colspan="2" style="padding:10px 0 0;"><hr style="border:none; border-top:1px solid #d2e3fc;"></td></tr>
    <tr><td colspan="2" style="font-weight:bold; padding:8px 0 4px; color:#202124;">German Bank Account</td></tr>
    <tr><td style="color:#5f6368; padding:3px 0;">IBAN:</td><td style="color:#202124;">DE91240703680071572200</td></tr>
    <tr><td style="color:#5f6368; padding:3px 0;">BIC:</td><td style="color:#202124;">DEUTDE2HP22</td></tr>
    <tr><td style="color:#5f6368; padding:3px 0;">Bank:</td><td style="color:#202124;">Postbank/DSL Ndl of Deutsche Bank</td></tr>
  </table>
</div>
```

### Result
Every payment reminder email — whether sent manually to clients, automatically via cron, or as team notifications — will include both bank accounts in a clean, styled card. The existing stars, gradients, and formatting remain untouched.

