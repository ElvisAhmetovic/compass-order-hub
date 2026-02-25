

## Add Editable Description Field to Client Reminder Modal

### Problem
The "Description" field in the client payment reminder email pulls directly from the order's description (`order.description`), which may contain internal notes not meant for clients. There's no way to edit it before sending.

### Solution
Add an editable "Description (for email)" input field in the modal, pre-filled with the order description. Users can modify or clear it before sending. The edited value gets passed as the `orderDescription` template variable instead of the raw order description.

### Changes

**`src/components/orders/SendClientReminderModal.tsx`**:

1. Add new state: `const [emailDescription, setEmailDescription] = useState("")`
2. Initialize it from `order.description` when modal opens (in a `useEffect` on `open`/`order`)
3. Add an editable `Input` or `Textarea` field labeled "Description (included in email)" in the Order Details tab, between the Order Date and Amount Due rows — or as a standalone field below the template/language selectors
4. In `getTemplateVariables()` (line 107): change `orderDescription: order.description || ""` to `orderDescription: emailDescription`
5. In the edge function call body (line 151): change `orderDescription: order.description` to `orderDescription: emailDescription`

The field will sit in the main form area (not inside a tab) so it's always visible, placed after the Email Subject field and before the separator. It will show a helper text explaining that this is what the client will see.

