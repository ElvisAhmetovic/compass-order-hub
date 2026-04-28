## Cilj

U Invoices stranici, kartica **"Paid This Month"** trenutno pokazuje samo iznos plaćen u tekućem mjesecu. Dodaćemo mogućnost da korisnik odabere bilo koji mjesec/godinu i vidi koliko je plaćeno u tom periodu.

## Šta se mijenja (samo UI/frontend)

**Fajl:** `src/pages/Invoices.tsx`

1. **Novi state:**
   - `selectedPaidMonth` (npr. `"2026-04"`) — default = trenutni mjesec.

2. **Dinamičko računanje:**
   - Izmijeniti postojeću `totalPaidThisMonth` logiku tako da filtrira plaćene fakture (`status === 'paid'`) prema `selectedPaidMonth` umjesto fiksno trenutnog mjeseca.
   - Koristiti `updated_at` ili `issue_date` (isto polje kao i sada) — provjeriti šta postojeći kod koristi i zadržati istu logiku.

3. **UI u kartici "Paid This Month":**
   - Dodati mali dropdown (`Select` iz shadcn/ui) u header kartice pored naslova.
   - Opcije: zadnjih 24 mjeseca generisanih dinamički, formatiranih kao "April 2026", "March 2026", itd.
   - Default selektovan: tekući mjesec.
   - Iznos ispod dropdowna se ažurira u realnom vremenu prema odabiru.

## Izgled

```
┌─────────────────────────────┐
│ Paid This Month  [April 2026 ▼]│
│ €13.643,68                  │
└─────────────────────────────┘
```

## Što NE diramo

- Bez izmjena baze, edge funkcija ili servisa.
- "Total Outstanding" i "Total Invoices" kartice ostaju netaknute.
- Bez izmjena PDF/email logike.
