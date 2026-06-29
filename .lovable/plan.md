## What actually happened

The Nousgerons invoice **was created successfully** — it's not missing. Here's the record:

- Invoice: **INV-2026-105**
- Amount: **€100**
- Status: **sent**
- Created: **2026-06-29 09:14:50 UTC** by **Thomas Klein**
- Linked to order: `86323485…` (Nousgerons, 19/06/2026, €100)

### Why your admin couldn't find it

There are **two client records sharing the same email** `contact@investissement-locatif.com`:


| Client ID   | Name                                    | Created    |
| ----------- | --------------------------------------- | ---------- |
| `9ac5a81d…` | **Investissement Locatif**              | 2026-02-19 |
| `b4d7ca74…` | **Nousgerons (Investissement Locatif)** | 2026-04-20 |


The order's company name is just `Nousgerons`, which doesn't exactly match either client name. So the lookup fell through to the email-only fallback and matched the **older** row (`Investissement Locatif`). The invoice exists in your list — just filed under "Investissement Locatif", not "Nousgerons". Searching "nousgerons" on the Invoices page therefore returns nothing.

## Fix plan

1. **Smarter client matching in `OrderActions.tsx` and `orderService.ts**` — when multiple clients share the same email, prefer the one whose name contains (or is contained in) the order's `company_name`. Only fall back to "first match" if none overlap. This stops new Nousgerons invoices from landing on the wrong client.
2. **Make Invoices search find by linked order's company name** in `src/pages/Invoices.tsx` — currently it only searches the invoice's own client name/number. Add the joined `orders.company_name` to the search predicate so typing "Nousgerons" surfaces INV-2026-105 even though its client is recorded as "Investissement Locatif".
3. **Re-link the existing INV-2026-105** to the `Nousgerons (Investissement Locatif)` client via a one-off migration, so it shows up correctly in the list right now without your admin re-creating anything.
4. **Optional cleanup (ask before doing)**: merge the two duplicate client rows so this can't happen again for this customer. I'll wait for your go-ahead before touching client data beyond step 3.

No schema changes needed — only a small data update for step 3 and frontend logic tweaks for steps 1 and 2.  
  
Also any new invoice created should be found at the top of the invoices by creation date, and also i dont know how exactly the system works but if someone from our team creates a new invoice even if its for the same company or offer or  order it should show up in the invoices right? 

&nbsp;