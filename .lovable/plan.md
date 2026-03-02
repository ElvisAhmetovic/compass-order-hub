

## Add "Create Invoice" Button to Monthly Installments

Each installment row gets an invoice button that navigates to `/invoices/new` with pre-filled data from the contract and installment.

### How It Works

1. **Button on each installment row** — A "Create Invoice" icon button in the table
2. **Auto-fill logic** — When clicked, navigate to `/invoices/new` passing state via React Router with:
   - **Client**: First try to match an existing invoice client by email (`client_email`), otherwise the user picks manually
   - **Line item**: description from `contract.description` (or "Monthly Service - [month_label]"), quantity 1, unit_price = installment amount, 19% VAT
   - **Currency**: from the contract
   - **Dates**: issue_date = today, due_date = installment due_date
   - **Language**: auto-detect from contract's `company_address` or country keyword (e.g. "Deutschland"/"Germany" → `de`, "Nederland" → `nl`, "France" → `fr`, etc.)
   - **Payment account**: set to `"both"` (Belgium + Germany)
   - **Notes**: include the month label reference

3. **InvoiceDetail.tsx picks up the state** — On mount, if `location.state` has monthly package data, pre-populate `formData`, `lineItems`, and `templateSettings` (language, payment account = "both")

### Country → Language Mapping

A utility function that scans the company address for country keywords:
- Deutschland/Germany → `de`
- Nederland/Netherlands → `nl`  
- France/Frankreich → `fr`
- España/Spain → `es`
- Danmark/Denmark → `da`
- Norge/Norway → `no`
- Česko/Czech → `cs`
- Polska/Poland → `pl`
- Sverige/Sweden → `sv`
- Default → `en`

### Files to Modify

| File | Change |
|------|--------|
| `src/components/monthly/MonthlyInstallmentsTable.tsx` | Add invoice button per row, add `useNavigate`, build pre-fill state, country detection function |
| `src/pages/InvoiceDetail.tsx` | Read `location.state` on mount, pre-fill formData + lineItems + templateSettings when coming from monthly packages |

No database changes needed — this uses the existing invoice system.

