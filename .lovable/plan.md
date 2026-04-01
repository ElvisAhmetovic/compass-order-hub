

## Extensive QA Analysis: Monthly Packages System

### Issues Found

---

**1. CRITICAL: VAT Net Price Calculation Wrong on Frontend**

In `MonthlyInstallmentsTable.tsx` (line 145) and `SendMonthlyInvoiceDialog.tsx` (line 108), the net price formula is:
```
netPrice = grossPrice / (1 + vatRate / 100)
```
But `vat_rate` is stored as a **decimal** (e.g., `0.19` for 19%) by `CreateMonthlyContractModal.tsx` (line 193: `vatPercentage / 100`). So the calculation becomes `grossPrice / (1 + 0.19/100)` = `grossPrice / 1.0019` — virtually no VAT deduction.

The edge function does it **correctly** at line 368: `totalAmount / (1 + vatRate)` (no extra `/100`).

**Impact**: Every manually created invoice from the UI has wrong net/VAT amounts when VAT is enabled. The line item `vat_rate` value (0.19) is correct for the DB trigger, so `line_total` recalculates correctly, but the `unit_price` (net) displayed in the invoice is wrong.

**Fix**: Change both frontend locations from `grossPrice / (1 + vatRate / 100)` to `grossPrice / (1 + vatRate)`.

---

**2. CRITICAL: Team Notification PDFs Are Corrupted in Edge Function**

In `generate-monthly-installments/index.ts`, `generateInvoicePDF()` returns `Uint8Array` (line 584). The client email correctly converts it to base64 (line 603: `btoa(String.fromCharCode(...))`). But at lines 837 and 908, `pdfBytes` (Uint8Array) is passed directly to `sendTeamNotifications()` which expects a `string` (base64) and passes it straight to Resend's `attachments[].content`.

**Impact**: Team members receive corrupted/broken PDF attachments on automated monthly invoices.

**Fix**: Convert `pdfBytes` to base64 before passing to `sendTeamNotifications`:
```typescript
const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
const teamSent = await sendTeamNotifications(..., pdfBase64);
```

---

**3. MEDIUM: No Duplicate Invoice Guard on Create Invoice Button**

`handleCreateInvoice` (line 120) runs every time the FileText button is clicked. The `hasInvoice` check (line 448) only controls the tooltip text, not the click handler. Clicking multiple times creates duplicate invoices for the same installment.

**Fix**: Add early return in `handleCreateInvoice` if `invoiceIdMap[inst.id]` or `inst.invoice_id` already exists. Show a toast saying "Invoice already exists" instead.

---

**4. LOW: Orphaned Invoices on Contract Delete**

`deleteContract` (service line 193) deletes from `monthly_contracts`. Installments likely cascade-delete via FK. But any linked invoices in the `invoices` table remain, orphaned with no parent reference.

**Impact**: Minor data hygiene issue. Orphaned invoices still show in the Invoices page.

**No fix needed now** — just flagging for awareness.

---

**5. LOW: Unnecessary `(contract as any)` Casts**

`MonthlyInstallmentsTable.tsx` and `SendMonthlyInvoiceDialog.tsx` use `(contract as any).vat_enabled` and `.vat_rate`, but the `MonthlyContract` interface already declares these fields. The casts are unnecessary.

**Fix**: Remove `as any` casts — use `contract.vat_enabled` and `contract.vat_rate` directly.

---

### No Issues Found With:
- Client matching (email+name priority) — correctly applied across all 3 locations (table, dialog, edge function)
- Autofill from order search — fills company info correctly, resets order-specific fields
- VAT toggle in create modal — correctly stores as decimal, preview math is correct
- Billing frequency — installments calculated correctly, labels display properly
- Invoice status sync (paid/sent toggles) — bi-directional sync with invoices table works
- Payment reminder activation — `next_reminder_at` set on invoice send (48h)
- Language detection — same regex in frontend and backend, 10 languages supported
- Edge function backward compat — checks both localized and German month labels
- Contract completion — auto-sets status to "completed" when duration exceeded
- Team email batching — 2 per batch with 1s delay for Resend rate limits

---

### Plan

**File 1: `src/components/monthly/MonthlyInstallmentsTable.tsx`**
- Line 145: Change `grossPrice / (1 + vatRate / 100)` to `grossPrice / (1 + vatRate)`
- Line 120-122: Add duplicate invoice guard — return early if invoice already linked
- Remove `(contract as any)` casts for vat_enabled/vat_rate

**File 2: `src/components/monthly/SendMonthlyInvoiceDialog.tsx`**
- Line 108: Change `grossPrice / (1 + vatRate / 100)` to `grossPrice / (1 + vatRate)`  
- Line 143: Same fix for PDF calculation
- Remove `(contract as any)` casts

**File 3: `supabase/functions/generate-monthly-installments/index.ts`**
- Lines 837 and 908: Convert `pdfBytes` to base64 string before passing to `sendTeamNotifications`

### Files to modify
1. `src/components/monthly/MonthlyInstallmentsTable.tsx` — Fix VAT calc, add duplicate guard, clean casts
2. `src/components/monthly/SendMonthlyInvoiceDialog.tsx` — Fix VAT calc, clean casts
3. `supabase/functions/generate-monthly-installments/index.ts` — Fix team PDF attachment encoding

