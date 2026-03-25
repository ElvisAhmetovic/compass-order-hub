

## Exclude UK Account from "All Accounts" Option

### What Changes
The "All Accounts" dropdown option currently includes all 3 bank accounts (Belgian, German, UK). Change it so "All Accounts" only includes Belgian + German. The UK account remains selectable individually.

### Files to Change (4 files)

**1. `src/components/invoices/components/PaymentInformation.tsx`**
- Change `selectedAccounts` logic: when `"both"`, filter to only Belgium + Germany (exclude UK)

**2. `src/components/invoices/InvoicePreview.tsx`**
- Change `selectedAccounts` for `"both"`: only include `belgiumAccount` and `germanyAccount` (remove `ukAccount`)

**3. `src/utils/invoicePdfGenerator.ts`**
- Same change: `"both"` selection only includes Belgian + German accounts in PDF output

**4. Edge functions** — no change needed since the email templates list all 3 accounts independently (they don't use the "both" selection logic)

