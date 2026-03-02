

## Fix Monthly Packages: Add Sidebar + Translate to English

Two issues: the page is missing the sidebar layout wrapper used by all other pages, and all text is in German.

### 1. Add Sidebar to `src/pages/MonthlyPackages.tsx`

Wrap the page content with `Sidebar` + `Layout` the same way `Dashboard.tsx` does:

```tsx
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex-1">
    <Layout>
      {/* existing content */}
    </Layout>
  </div>
</div>
```

Import `Sidebar` from `@/components/dashboard/Sidebar`.

### 2. Translate `MonthlyPackages.tsx` to English

| German | English |
|--------|---------|
| Monatspakete | Monthly Packages |
| Jahresverträge mit monatlicher Abrechnung verwalten | Manage yearly contracts with monthly billing |
| Neuer Vertrag | New Contract |
| Aktive Verträge | Active Contracts |
| Bezahlte Raten | Paid Installments |
| Offene Raten | Open Installments |
| Einnahmen (bezahlt) | Revenue (paid) |
| Fehler beim Laden | Error loading data |
| Laden... | Loading... |

### 3. Translate `CreateMonthlyContractModal.tsx` to English

All labels, placeholders, toasts, and button text:
- "Neuen Monatsvertrag erstellen" → "Create New Monthly Contract"
- "Kundenname" → "Client Name", "E-Mail" → "Email"
- "Gesamtwert" → "Total Value", "Währung" → "Currency"
- "Laufzeit (Monate)" → "Duration (months)"
- "Startdatum" → "Start Date", "Beschreibung" → "Description"
- "Monatliche Rate" → "Monthly Installment"
- "Raten" → "installments"
- "Abbrechen" → "Cancel", "Vertrag erstellen" → "Create Contract"
- "Erstelle..." → "Creating..."
- Toast messages translated

### 4. Translate `MonthlyInstallmentsTable.tsx` to English

All German strings:
- "Als bezahlt/unbezahlt markiert" → "Marked as paid/unpaid"
- "Vertrag gelöscht" → "Contract deleted"
- "Noch keine Monatsverträge..." → "No monthly contracts yet..."
- "/ Monat" → "/ month", "Gesamt:" → "Total:"
- "bezahlt" → "paid"
- "Aktiv/Abgeschlossen/Storniert" → "Active/Completed/Cancelled"
- Table headers: Monat→Month, Fällig am→Due Date, Betrag→Amount, Status, Bezahlt→Paid
- "Gesendet/Ausstehend" → "Sent/Pending"
- "Bezahlt/Unbezahlt" → "Paid/Unpaid"
- Delete dialog text translated
- "Fehler" → "Error"

