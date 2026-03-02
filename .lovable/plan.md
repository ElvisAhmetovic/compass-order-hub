

## Enhance Monthly Packages: Autofill, Full Form Fields & Automated Notifications

The user wants two things:
1. The "Create Contract" modal should match the Dashboard's "Create Order" modal — with the OrderSearchDropdown autofill, company address, phone, company link, inventory items, description, internal notes, priority, and assign-to fields.
2. The cron edge function should also email the hardcoded team list when it sends a client invoice, notifying the team that a payment reminder was sent.

### Changes

#### 1. Update `CreateMonthlyContractModal.tsx` — Match Dashboard Create Order

Rebuild the modal to include:
- **OrderSearchDropdown** for autofilling company info from existing orders
- All fields from CreateOrderModal: Company Name, Contact Email, Company Address, Contact Phone, Company Link, Price (total value), Currency, Duration, Start Date, Priority, Assign To, Inventory Items (via `InventoryItemsSelector`), Client Description, Internal Notes
- Auto-calculate monthly installment display
- Use `react-hook-form` + `zod` validation like the dashboard modal
- Load users list for "Assign To" dropdown
- Keep the monthly installment preview card

The autofill will copy company info (name, email, address, phone, link, currency) from a selected order, same as the dashboard.

#### 2. Update DB schema — Add new columns to `monthly_contracts`

Add columns to support the extra fields:
- `company_address text`
- `contact_phone text`
- `company_link text`
- `priority text DEFAULT 'medium'`
- `assigned_to uuid`
- `assigned_to_name text`
- `internal_notes text`
- `inventory_items text`

#### 3. Update `monthlyContractService.ts`

Update the `MonthlyContract` interface and `createContract` method to include the new fields.

#### 4. Update `generate-monthly-installments` edge function — Add team notification

After sending the client invoice email, also:
- Send an email to all hardcoded team emails (from `NOTIFICATION_EMAIL_LIST`) notifying them: "Monthly payment reminder sent to [Company Name] for [Month] — [Amount]"
- Use the same 500ms delay pattern between sends to avoid rate limiting
- Create in-app notifications for all team members (same pattern as `send-order-payment-reminders`)

#### 5. Update `MonthlyInstallmentsTable.tsx`

Show additional info in the contract header row (address, phone, link) when available.

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Add new columns to `monthly_contracts` |
| `src/components/monthly/CreateMonthlyContractModal.tsx` | Rebuild with full form + autofill |
| `src/services/monthlyContractService.ts` | Update interface + service |
| `supabase/functions/generate-monthly-installments/index.ts` | Add team email notifications |
| `src/components/monthly/MonthlyInstallmentsTable.tsx` | Show extra fields |

