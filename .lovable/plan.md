

## Restructure Invoice Layout: Move Company Details to Header, Replace with Client Info

### Current layout (top to bottom)
```text
┌─────────────────────────────────────────────┐
│ [Logo] AB MEDIA TEAM          RE NR: 784/25 │
│         Weseler Str.73...                   │
│         kontakt.abmedia@gmail.com           │
├─────────────────────────────────────────────┤
│ AB MEDIA TEAM                  Date: ...    │
│ Ansprechpartner: Andreas Berger Due: ...    │
│ Firmenreg.: 15748871       Balance Due: ... │
│ UID: DE123418679                            │
│ Weseler Str.73 47169 Duisburg               │
│ kontakt.abmedia@gmail.com                   │
├─────────────────────────────────────────────┤
│ Rechnung an:                                │
│ Client Name / email / address               │
└─────────────────────────────────────────────┘
```

### New layout (what you want)
```text
┌─────────────────────────────────────────────┐
│ [Logo] AB MEDIA TEAM          RE NR: 784/25 │
│   Ansprechpartner: Andreas Berger           │
│   Firmenreg.: 15748871                      │
│   UID: DE123418679                          │
│   Weseler Str.73 47169 Duisburg             │
│   kontakt.abmedia@gmail.com                 │
├─────────────────────────────────────────────┤
│ Rechnung an:               Date: ...        │
│ Client Name                Due: ...         │
│ client@email.com           Balance Due: ... │
│ Client Address                              │
│ City, Country                               │
└─────────────────────────────────────────────┘
```

### Changes

**1. `src/components/invoices/InvoicePreview.tsx`**

- **Header section (lines 533-542)**: Replace the short address/email snippet with the full company details block (contact person, registration number, UID, address, email) using translated labels.
- **Company Details section (lines 555-584)**: Remove the left-side company info block. Replace it with the "Bill To" client info (currently at lines 586-607), keeping the right-side date/due/balance column as-is.
- **Bill To section (lines 586-607)**: Remove this entire standalone section since it's now merged into the section above.

**2. `src/utils/invoicePdfGenerator.ts`**

- **Header section (lines 692-701)**: Same change -- replace address/email with full company details (contact person, registration, UID, address, email).
- **Company Details section (lines 715-741)**: Replace left column with client "Bill To" info, keep right column (dates + balance).
- **Bill To section (lines 743-760)**: Remove entirely.

This also saves vertical space in the PDF, helping everything fit on one page.

