

## Auto-Create Client When Missing in Invoice System

The issue: when clicking "Create Invoice" on a monthly installment, it fails because the client email from the contract doesn't exist in the `clients` table (invoice system). Currently it just shows an error.

### Fix

In `handleCreateInvoice` inside `MonthlyInstallmentsTable.tsx`, instead of showing an error when no matching client is found, **auto-create the client** using `InvoiceService.createClient()` with data from the contract:

```ts
let matched = clients.find(c => c.email.toLowerCase() === contract.client_email.toLowerCase());
if (!matched) {
  // Auto-create client from contract data
  matched = await InvoiceService.createClient({
    name: contract.client_name,
    email: contract.client_email,
    contact_person: contract.client_name,
    company: contract.client_name,
    address: contract.company_address || "",
    phone: contract.contact_phone || "",
    vat_number: "",
    notes: "Auto-created from Monthly Packages",
    user_id: "", // will be set by createClient
  });
  toast({ title: "Client auto-created", description: `Client "${contract.client_name}" was added to the invoice system.` });
}
```

Then proceed with invoice creation as normal. Same fix in `handleOpenSendDialog` if it also looks up clients.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/monthly/MonthlyInstallmentsTable.tsx` | Replace the "client not found" error with auto-create logic in both `handleCreateInvoice` and `handleOpenSendDialog` |

