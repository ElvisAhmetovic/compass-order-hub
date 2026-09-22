# Currency Logic — Orders & Invoices (AB Media Team CRM)

Short answer for the "200 Turkish lira" question: **the system never converts anything.**
An amount is stored as a plain number plus a currency *code*; every screen, PDF and email just
prints that number with the matching symbol. Turkish lira (TRY) is **not** in the supported list,
so it cannot be selected at all today — the selector only offers 10 currencies.

---

## 1. Supported currencies

Two hardcoded lists (duplicated — see "Known issues"):

`src/components/invoices/CurrencySelector.tsx` → `SUPPORTED_CURRENCIES`
`src/components/invoices/constants.ts` → `CURRENCIES`

```
EUR €, USD $, GBP £, JPY ¥, CAD C$, AUD A$, CHF ₣ (CHF in one list), SEK kr, NOK kr, DKK kr
```

Default everywhere: **EUR**.

To add TRY you must add `{ code: 'TRY', name: 'Turkish Lira', symbol: '₺' }` to **both** lists,
plus the symbol map in `src/utils/currencyUtils.ts` and the small symbol maps inside the edge
functions (`send-offer-email`, `send-invoice-payment-reminders`).

## 2. Where currency is stored

| Entity | Column | Default | Set by |
|---|---|---|---|
| `orders` | `currency` (text) | `'EUR'` | Create Order modal, `currency: z.string().default("EUR")` |
| `invoices` | `currency` (text) | `'EUR'` | Invoice detail form / creation payload |
| `offers` | `currency` (text) | inherited from the order | Create Order modal → `send-offer-email` |
| `invoice_line_items` | *none* | — | lines inherit the invoice currency |
| `payments` | *none* | — | a payment is assumed to be in the invoice currency |

Important: **line items and payments carry no currency of their own.** They are implicitly in the
parent invoice's currency. There is no FX field, no rate stored on the record, no base-currency
column.

## 3. Formatting logic

`src/utils/currencyUtils.ts`

```ts
export const getCurrencySymbol = (currencyCode = 'EUR'): string => {
  const currencyMap = { EUR:'€', USD:'$', GBP:'£', JPY:'¥', CAD:'C$',
                        AUD:'A$', CHF:'₣', SEK:'kr', NOK:'kr', DKK:'kr' };
  return currencyMap[currencyCode] || '€';        // unknown code silently becomes €
};

export const formatCurrency = (amount: number, currencyCode = 'EUR'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;          // always symbol-prefix, 2 decimals, dot separator
};
```

Two consequences:

1. An **unrecognised code falls back to `€`** — so if `TRY` ever reached the database through an
   import or API call, the UI would print `€200.00` for 200 lira. That is exactly the failure mode
   your colleague is asking about.
2. Formatting is US-style (`€1234.50`), not the German style used on the dashboard cards
   (`€1.234,50`). Two different formatters coexist.

The edge functions have their own smaller maps:

```ts
// supabase/functions/send-invoice-payment-reminders/index.ts
const formatPrice = (amount: number, currency: string) => {
  const symbols = { EUR:'€', USD:'$', GBP:'£' };
  const symbol = symbols[currency] || currency;    // falls back to the CODE, not €
  return `${symbol}${Number(amount).toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
};
```

So a reminder email for a CHF invoice prints `CHF1.234,50`, while the app prints `₣1234.50`.

## 4. Conversion utilities (present but unused in the invoice flow)

`currencyUtils.ts` also exposes a **static** rate table and converters:

```ts
let cachedRates = { EUR:1, USD:1.09, GBP:0.87, JPY:149.50, CAD:1.46,
                    AUD:1.62, CHF:0.98, SEK:11.08, NOK:11.42, DKK:7.46 };

export const fetchExchangeRates = async () => cachedRates;   // no live API call
export const convertCurrency = (amount, from, to) =>
  (amount / cachedRates[from]) * cachedRates[to];
export const getExchangeRate = (from, to) => cachedRates[to] / cachedRates[from];
```

These are **only** used by the standalone `src/components/dashboard/CurrencyConverter.tsx` widget.
No invoice, order, offer, PDF, email or report calls `convertCurrency`. The rates are hardcoded
and stale; nothing refreshes them.

## 5. Flow: order → offer → invoice → PDF → email

```
Create Order modal
  price: number            (gross; VAT is derived back out of it)
  currency: 'EUR' default  ─────────────► orders.currency
        │
        ├─► send-offer-email: formatPrice(price, order.currency)
        │     offers.currency = order.currency
        │
        └─► confirm-offer: copies offer.currency onto the created order
                  │
                  └─► Invoice created from the order
                        invoices.currency  (audit log also records order_currency)
                              │
    ┌─────────────────────────┼──────────────────────────────┐
    ▼                         ▼                              ▼
InvoiceDetail form      InvoicePreview               invoicePdfGenerator
formData.currency  ◄──► templateSettings.currency    formData?.currency
                                                     ?? templateSettings.currency
                                                     ?? 'EUR'
```

Key mechanics in `src/pages/InvoiceDetail.tsx`:

* `formData.currency` and `templateSettings.currency` are kept in **two-way sync** by two
  `useEffect`s (lines ~116–129) — changing either updates the other.
* The PDF is generated with `{ ...templateSettings, currency: formData.currency }`, so the form
  value always wins.
* Totals (`netAmount`, `vatAmount`, `totalAmount`, paid, outstanding) are all rendered through
  `formatCurrency(value, formData.currency)` — the *numbers* are untouched by the currency choice.

Changing an invoice's currency from EUR to USD therefore **relabels** €500 as $500. It does not
recalculate. That is by design in this codebase (the price is negotiated in the target currency),
but it is a trap if someone switches currency on an existing invoice.

## 6. Mixed-currency aggregation (the real bug)

`src/components/dashboard/FinanceSummaryCards.tsx`

```ts
.select('id, status, total_amount, due_date, issue_date, payments(amount)')
...
monthTotal += Number(invoice.total_amount || 0);
...
const fmt = (value) => `€${value.toLocaleString('de-DE', {...})}`;   // € hardcoded
```

Invoices are summed **without grouping by currency** and the result is labelled €. Same pattern on
the Invoices list totals. With only EUR invoices in the database this is invisible; the moment a
USD or TRY invoice exists, the dashboard figure is meaningless (200 lira would add 200 to the euro
total).

`src/utils/invoiceBalance.ts` (paid / outstanding) also assumes payments share the invoice currency.

## 7. Answering the colleague's scenario directly

> "We send a client an invoice for 200 Turkish lira — what does the system say? Does it use euro?"

1. **Today it can't happen through the UI.** TRY is not in `SUPPORTED_CURRENCIES` / `CURRENCIES`.
2. If `TRY` were written into `invoices.currency` directly (SQL, import, API), then:
   * app UI and PDF → `getCurrencySymbol('TRY')` misses the map → prints **`€200.00`** (wrong).
   * reminder emails → `symbols['TRY']` misses → prints **`TRY200,00`** (correct-ish).
   * dashboard/list totals → adds a bare `200` into a €-labelled sum (wrong).
3. If TRY is added properly to all four maps, the invoice prints `₺200,00` end to end and
   **stays 200 lira** — no euro conversion at any point. The euro total on the dashboard would
   still be wrong until aggregation is grouped by currency.

## 8. What to change when rebuilding

1. **One source of truth** for the currency list (one module, imported by UI *and* edge functions)
   instead of four maps that drift.
2. **Never fall back to €** on an unknown code — fall back to the code itself, or throw.
3. Use `Intl.NumberFormat(locale, { style:'currency', currency: code })` instead of manual
   symbol-prefixing; it handles placement, separators and decimal count (JPY has 0 decimals — the
   current code wrongly prints `¥200.00`).
4. **Group every aggregate by currency**, or store a `base_amount` + `fx_rate` + `fx_date` on each
   invoice and report in a base currency. Pick one; do not label mixed sums with `€`.
5. Store the currency on `payments` too and reject a payment whose currency differs from the
   invoice.
6. Lock the currency once an invoice leaves draft, or force a totals recalculation, so switching
   codes can't silently relabel amounts.
7. Drop the hardcoded `cachedRates`, or wire `fetchExchangeRates` to a real API with caching if
   conversion is ever needed.

---

### File map

| Concern | File |
|---|---|
| Currency list + selector | `src/components/invoices/CurrencySelector.tsx` |
| Duplicate list | `src/components/invoices/constants.ts` (`CURRENCIES`) |
| Symbols, formatting, rates, conversion | `src/utils/currencyUtils.ts` |
| Order currency entry | `src/components/dashboard/CreateOrderModal.tsx` |
| Invoice currency state & sync | `src/pages/InvoiceDetail.tsx` |
| Preview rendering | `src/components/invoices/InvoicePreview.tsx` |
| PDF rendering | `src/utils/invoicePdfGenerator.ts` |
| List + totals | `src/pages/Invoices.tsx` |
| Dashboard totals (€ hardcoded) | `src/components/dashboard/FinanceSummaryCards.tsx` |
| Paid / outstanding | `src/utils/invoiceBalance.ts` |
| Offer emails | `supabase/functions/send-offer-email/index.ts` |
| Reminder emails | `supabase/functions/send-invoice-payment-reminders/index.ts` |
| Offer → order copy | `supabase/functions/confirm-offer/index.ts` |
| Standalone converter widget | `src/components/dashboard/CurrencyConverter.tsx` |
