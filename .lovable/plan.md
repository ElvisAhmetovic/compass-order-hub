

## Add "Pause Reminders" Toggle to Each Invoice

### What
A small toggle button on each invoice row in the table that lets admins manually disable/enable automated payment reminders for that specific invoice. This serves as a safety fallback when a client reports they've already paid but reminders keep coming.

### How

**1. Database: Add `reminders_paused` column to `invoices` table**

New migration adding a boolean column:
```sql
ALTER TABLE invoices ADD COLUMN reminders_paused boolean NOT NULL DEFAULT false;
```

**2. Edge Function: `send-invoice-payment-reminders/index.ts`**

Add a check in the reminder processing loop to skip invoices where `reminders_paused = true`. This is the actual enforcement point.

**3. UI: Add toggle in invoice table row** (`src/pages/Invoices.tsx`)

- Add a new column header "Reminders" (or a bell icon) between Status and Actions
- Each row gets a small Switch/toggle (bell icon with on/off state)
- Clicking it updates `invoices.reminders_paused` directly via supabase
- Shows a muted bell icon when paused, active bell when enabled
- Toast confirmation: "Reminders paused for INV-XXX" / "Reminders resumed for INV-XXX"

**4. Update TypeScript type** (`src/types/invoice.ts`)

Add `reminders_paused?: boolean` to the `Invoice` interface.

### Files to modify
1. New migration — add `reminders_paused` column
2. `src/types/invoice.ts` — add field to interface
3. `src/pages/Invoices.tsx` — add toggle column in table
4. `supabase/functions/send-invoice-payment-reminders/index.ts` — skip paused invoices

