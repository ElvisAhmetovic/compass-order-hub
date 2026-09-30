# Invoices made from an order keep the order's currency

## Problem
When you make an invoice from an order using the "Create Invoice" option in the order row menu, the invoice is always saved in euros, even if the order is in pounds or another currency. Right now 4 invoices are in EUR while their orders are in GBP. There is also 1 invoice in GBP whose order is in EUR.

## Fix
1. Order row "Create Invoice": use the order's currency (euros only when the order has none). Right now this path always saves EUR.
2. Invoice made from an offer: use the offer's currency instead of always EUR.
3. Other ways of making an invoice from an order (the order actions menu and changing the status to Invoice Sent/Paid) already copy the currency. No change is needed there.
4. Existing data: switch the 4 invoices from EUR to GBP so they match their orders. Only the currency label changes; amounts stay the same. The 1 GBP invoice whose order is in EUR stays as it is. It may be on purpose.

## Technical details
- `src/components/dashboard/OrderRow.tsx` line 182: change `currency: 'EUR'` to `orderData.currency || 'EUR'`.
- `src/services/invoiceService.ts` line 722 (createInvoiceFromProposal): use `proposal.currency || 'EUR'`.
- Data update: `update invoices i set currency = o.currency from orders o where o.id = i.order_id and o.currency = 'GBP' and i.currency = 'EUR'` (4 rows).
