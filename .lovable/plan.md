

## Add Edit Capability to Offer Details Dialog

### Problem
The "View Offer" dialog shows offer details as read-only text. The boss wants to edit fields (price, client name, email, description, etc.) before clicking "Send Again" or "Confirm for Client".

### Solution
Convert the read-only offer details dialog into an editable form. When the user opens an offer, fields are pre-filled and editable. Changes are saved to the database before resending or confirming.

### Changes

**`src/pages/Offers.tsx`** — Single file change:

1. **Add edit state**: Track edited fields with `useState` initialized from `selectedOffer` when it changes. Add an `isEditing` toggle (default true when dialog opens, or use an "Edit" button).

2. **Replace static text with inputs**: In the dialog (lines 274-316), replace `<p className="font-medium">` elements with `<Input>` components for: client_name, company_name, client_email, client_phone, client_address, price, description. Currency stays as-is (or add a select).

3. **Add "Save Changes" button**: When fields are modified, show a save button that updates the offer in Supabase via `UPDATE` on the `offers` table. Also update `order_data` JSON if relevant fields change.

4. **Wire edited data into resend/confirm**: `handleResend` and `handleConfirmForClient` already use the `selectedOffer` or `confirmOffer` object — after saving edits, the local state reflects the updated values, so these flows automatically use the corrected data.

5. **Add UPDATE RLS policy**: The `offers` table currently has no UPDATE policy. Need a migration to add one for non-client authenticated users.

### Database Migration
```sql
CREATE POLICY "Non-client authenticated users can update offers"
ON public.offers FOR UPDATE TO authenticated
USING (NOT is_client())
WITH CHECK (NOT is_client());
```

### UI Flow
- Open offer → fields are editable inline
- Edit price/name/etc → click "Save Changes" 
- Then click "Send Again" or "Confirm for Client" with corrected data

