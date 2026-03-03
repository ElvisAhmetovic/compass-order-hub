

## Add Editable "Bill To" Override Section in Invoice Edit Form

### What this does
Adds a section below the Client dropdown in the invoice edit form that lets you override the billing details (name, email, address, city, zip, country) that appear in the "Bill To" section of the PDF. When a client is selected, the fields auto-fill with the client's data, but you can freely edit them before generating the PDF.

### How it works

1. **New state in `InvoiceDetail.tsx`**: Add a `billToOverride` state object with fields: `name`, `email`, `address`, `city`, `zip_code`, `country`. When a client is selected, auto-populate these fields from the client data. The user can then edit any field.

2. **New UI section in the edit form** (below the Client dropdown): A collapsible or always-visible card titled "Bill To (PDF)" with input fields for name, email, address, city/zip, and country. These fields are pre-filled from the selected client but are independently editable.

3. **Pass overrides to PDF generator**: When generating/previewing the PDF, instead of passing `selectedClient` directly, pass a merged client object that uses the override values. This way the PDF reflects whatever the user typed.

### Files to modify

1. **`src/pages/InvoiceDetail.tsx`**
   - Add `billToOverride` state with client fields
   - Add `useEffect` that populates `billToOverride` when `formData.client_id` changes (finding the client from the `clients` array)
   - Add editable "Bill To" fields UI below the client dropdown (inside the Invoice Details card)
   - Create a `billToClient` object that merges override values, and pass it instead of `selectedClient` to `InvoicePreview`, `generateInvoicePDF`, and `SendInvoicePDFDialog`

2. **No changes needed to `invoicePdfGenerator.ts`** — it already renders from the `client` object passed to it; we just pass the overridden version.

### Technical detail

```ts
// New state
const [billToOverride, setBillToOverride] = useState({
  name: '', email: '', address: '', city: '', zip_code: '', country: ''
});

// Auto-fill when client changes
useEffect(() => {
  if (selectedClient) {
    setBillToOverride({
      name: selectedClient.name || '',
      email: selectedClient.email || '',
      address: selectedClient.address || '',
      city: selectedClient.city || '',
      zip_code: selectedClient.zip_code || '',
      country: selectedClient.country || '',
    });
  }
}, [formData.client_id, clients]);

// Merged client for PDF
const billToClient = selectedClient ? { ...selectedClient, ...billToOverride } : undefined;
```

The UI will be a simple grid of inputs (Name, Email, Address, City, Zip Code, Country) placed right after the client selector, labeled "Bill To Details (editable for PDF)".

