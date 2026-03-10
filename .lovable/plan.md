

## Reverse the VAT Calculator: Brutto → Netto

Change the calculator so the user inputs a **Brutto (gross)** amount and it calculates Netto and MwSt from that.

### Math
- `netto = brutto / (1 + vatPercent/100)`
- `mwst = brutto - netto`

### Changes in `src/components/invoices/VatCalculator.tsx`
1. Rename state `netAmount` → `grossAmount` (the input field)
2. Change input label from "Nettobetrag (€)" to "Bruttobetrag (€)"
3. Reverse the calculation: from gross, derive net and VAT
4. In results, show Netto first (as the computed value), then MwSt, then Brutto (bold, echoing input)
5. Keep everything else (VAT rate buttons, copy buttons, custom rate) the same

