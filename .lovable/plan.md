

## Add Search to Client Dropdown in Invoice Creation

### Problem
The client selector on the "Create New Invoice" page (`/invoices/new`) is a plain `<Select>` dropdown with no search/filter capability. With many clients, finding the right one is tedious.

### Fix
Replace the Radix `<Select>` with a searchable combobox using the existing `cmdk` (`Command`) component pattern — similar to how `OrderSearchDropdown` works. This gives a search input inside the dropdown that filters clients by name or email as you type.

### Changes

**`src/pages/InvoiceDetail.tsx`** (lines 509-523):

1. Add a `clientSearch` state variable for the filter text
2. Replace the `<Select>` + `<SelectContent>` + `<SelectItem>` block with a `<Popover>` + `<Command>` combo:
   - A `<PopoverTrigger>` button showing the selected client name or "Select a client" placeholder
   - Inside `<PopoverContent>`: a `<CommandInput>` for searching, `<CommandList>` with `<CommandEmpty>` ("No clients found"), and `<CommandGroup>` mapping filtered clients to `<CommandItem>` entries
   - Each item shows `client.name - client.email`
   - On select, call `handleFormDataChange('client_id', value)` and close the popover
3. Filter logic: match `client.name` or `client.email` against the search term (case-insensitive)

Uses existing imports: `Popover`/`PopoverContent`/`PopoverTrigger` from `@/components/ui/popover` and `Command`/`CommandInput`/`CommandList`/`CommandEmpty`/`CommandGroup`/`CommandItem` from `@/components/ui/command`.

