# Fix: editing an order (internal notes leaking to Client Update, changes not saving)

## What the user sees
- Typing in **Internal Notes** while editing an order ends up in **Client Update** (visible to the client).
- Changing the **price** (or anything else) and saving does not change the order.

## What I already checked
- The edit form itself keeps the two fields separate: Internal Notes writes only `internal_notes`, Client Update writes only `client_visible_update`, and Save sends both separately.
- So the cause is most likely after Save: either the database changes/rejects the update (a rule or trigger on orders), or the order window keeps showing the old order after saving. This is not confirmed yet.

## Steps
1. **Reproduce** on a test order (QA Test order only, no real client data): edit internal notes + price, save, then read the saved row back from the database and look at the browser network response.
2. **Inspect the database rules on orders** (triggers and update policies) for anything that copies `internal_notes` into `client_visible_update` or silently blocks the update; fix it with a migration if found.
3. **Fix the save path**:
   - Make the update fail loudly if zero rows were saved (no silent "Order Updated" toast when nothing changed).
   - After save, reload the order shown in the open window so the new price/notes appear immediately, not the stale copy.
4. **Guard internal notes**: make sure no code path (save, update emails, portal loaders) ever writes or shows `internal_notes` as the client update.
5. **Test**: add a small test that the save payload keeps internal notes and client update separate and includes the new price; re-run the edit on the test order and confirm the window, order list, and client portal show the right values.

## Technical notes
- Files: `src/components/dashboard/OrderEditForm/useOrderEdit.ts`, `OrderModal.tsx`, `src/services/orderService.ts` (`updateOrder` uses `.single()` after update, which per project rules can hide RLS failures).
- Live data stays read-only except the QA test order.
