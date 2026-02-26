

## Rename "Terms/Bedingungen" to "Bank Details/Bankverbindung" + Option to Show One or Both Payment Accounts

### What's changing

Two things:

1. **Rename the label** — The section in the invoice PDF/preview that currently says "Terms:" / "Bedingungen:" / "Voorwaarden:" etc. actually shows bank account details, not terms. It should say "Bank Details:" / "Bankverbindung:" / "Bankgegevens:" etc. in each language.

2. **Show one or both payment accounts** — Currently you can only pick Belgium OR Germany. A new option will let you choose "Both" so both accounts appear together in the PDF.

### Changes

**1. `src/components/invoices/InvoicePreview.tsx`**
- Rename the `terms` key in all 10 language translation blocks to use "Bank Details" / "Bankverbindung" / "Bankgegevens" / "Coordonnées bancaires" / "Datos bancarios" / "Bankoplysninger" / "Bankdetaljer" / "Bankovní údaje" / "Dane bankowe" / "Bankuppgifter"
- Update the payment account rendering logic (lines 664-673) to support `selectedPaymentAccount === "both"` — when "both", render both Belgium and Germany accounts stacked
- Update the `selectedAccount` logic (lines 94-109) to handle the "both" case by returning an array or rendering both inline

**2. `src/utils/invoicePdfGenerator.ts`**
- Same `terms` label rename in all 10 language blocks (lines 383-570)
- Same "both accounts" rendering logic in the HTML template (lines 784-791)
- Update `selectedAccount` logic (lines 358-373) to handle "both"

**3. `src/components/invoices/constants.ts`**
- Add a third entry to `PAYMENT_ACCOUNTS` array or add a synthetic "both" option, OR handle "both" purely in the UI selector

**4. `src/components/invoices/components/PaymentInformation.tsx`**
- Add a "Both Accounts" option in the payment account dropdown (alongside Belgium and Germany)
- When "both" is selected, show both accounts' details in the preview panel

**5. `src/components/invoices/hooks/useInvoiceSettings.ts`**
- No structural changes needed; `selectedPaymentAccount` already accepts any string, so "both" works out of the box

### Technical detail

The "both" option will be rendered as a synthetic entry in the `<Select>` dropdown. In the preview and PDF, when `selectedPaymentAccount === "both"`, both account blocks (Belgium IBAN + Germany IBAN) will be rendered vertically stacked under the "Bankverbindung" heading, each with its own translated account name as a sub-header.

