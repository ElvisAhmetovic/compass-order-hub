

## Auto-Create Invoice + Send Invoice Modal from Monthly Packages

Three changes requested:

### 1. Fix VAT: Price is VAT-inclusive
Currently the installment amount (e.g. €100) gets 19% VAT added on top → €119. The user wants €100 to BE the total. So the line item should use:
- `unit_price = amount / 1.19` (net price)
- `vat_rate = 0.19`
- Result: net + VAT = original amount

### 2. Auto-create invoice in background (no navigation)
Replace the current `navigate("/invoices/new")` approach. Instead, when clicking the "Create Invoice" button:
1. Load clients from DB, match by email
2. Load saved invoice template settings from localStorage (for logo, company info, payment accounts)
3. Build the invoice via `InvoiceService.createInvoice()` with the correct line item
4. Set language and payment account = "both" on the template settings
5. Show toast: "Invoice INV-2026-XXX created for [Client Name] — [Month]"
6. Store the created invoice ID on the installment (optional) or just confirm

The logo issue: the template settings are loaded from localStorage (via `useInvoiceSettings`). The auto-create flow will read `localStorage.getItem('invoiceTemplateSettings')` to get the saved logo/company info so the PDF generation later uses the correct logo.

### 3. Add "Send Invoice" button next to "Create Invoice"
A new button (Mail icon) on each installment row that opens a `SendMonthlyInvoiceDialog` modal with:
- **Client email** (pre-filled from contract)
- **Client name** (shown, read-only)
- **Subject** (editable input, default: "Invoice [number] — [month]")
- **Language dropdown** (en, de, nl, fr, es, da, no, cs, pl, sv) — auto-detected from address
- **Message textarea**
- **Send button** — generates PDF with correct template settings (logo, language, payment=both, VAT-inclusive pricing), sends via `send-invoice-pdf` edge function, also notifies team emails
- Toast: "Invoice sent to [email]"

### Files to Modify

| File | Change |
|------|--------|
| `src/components/monthly/MonthlyInstallmentsTable.tsx` | Replace navigate with auto-create logic; fix VAT calc; add Send Invoice button + dialog state |
| `src/components/monthly/SendMonthlyInvoiceDialog.tsx` | **New file** — modal with email, name, subject, language dropdown, message, send button; generates PDF + sends via edge function + team notification |

### Technical Details

**VAT-inclusive calculation:**
```ts
const netPrice = Number((inst.amount / 1.19).toFixed(2));
// line item: unit_price = netPrice, vat_rate = 0.19
// Result: netPrice * 1.19 ≈ inst.amount
```

**Auto-create flow in MonthlyInstallmentsTable:**
```ts
const handleCreateInvoice = async (contract, inst) => {
  const clients = await InvoiceService.getClients();
  const matched = clients.find(c => c.email === contract.client_email);
  if (!matched) { toast error "Client not found in invoice system"; return; }
  
  const netPrice = Number((inst.amount / 1.19).toFixed(2));
  const description = contract.description ? `${contract.description} - ${inst.month_label}` : `Monthly Service - ${inst.month_label}`;
  
  const invoice = await InvoiceService.createInvoice({
    client_id: matched.id,
    issue_date: new Date().toISOString().split("T")[0],
    due_date: inst.due_date,
    currency: contract.currency,
    payment_terms: "Net 3",
    notes: `Monthly package: ${inst.month_label}`,
    internal_notes: "",
    line_items: [{ item_description: description, quantity: 1, unit: "pcs", unit_price: netPrice, vat_rate: 0.19, discount_rate: 0 }],
  });
  
  toast({ title: "Invoice created", description: `Invoice ${invoice.invoice_number} created for ${contract.client_name} — ${inst.month_label}` });
};
```

**SendMonthlyInvoiceDialog:** Reuses `generateInvoicePDFBase64` and `supabase.functions.invoke("send-invoice-pdf")` pattern from the existing `SendInvoicePDFDialog`. Loads template settings from localStorage, overrides language from dropdown and payment account to "both". Fetches the latest invoice for the client to get the invoice number, or allows creating one on the fly if none exists.

