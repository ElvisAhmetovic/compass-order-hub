

## Set Default Invoice Number Prefix to "INV-"

### Change
In `src/components/invoices/hooks/useInvoiceSettings.ts`, line 51, change the `invoiceNumberPrefix` default from `""` to `"INV-"`.

This ensures new invoices start with the "INV-" prefix out of the box. Users who have already saved custom settings in localStorage will keep their saved value.

