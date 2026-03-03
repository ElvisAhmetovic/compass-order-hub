

## Fix Invoice Settings Defaults

Two changes needed in `src/components/invoices/hooks/useInvoiceSettings.ts`, lines 42-51 (the `baseSettings` object):

1. **VAT Rate**: Change `vatRate: 19` → `vatRate: 0`
2. **Payment Account**: Change `selectedPaymentAccount: "belgium"` → `selectedPaymentAccount: "both"`

Note: Users with existing saved settings in localStorage will retain their old values. This only affects new/fresh defaults.

