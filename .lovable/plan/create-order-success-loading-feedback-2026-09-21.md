# Create Order success/loading feedback

## Goal
Make the Create New Order flow clearly show what is happening after someone clicks **Create Order** or **Send Offer**, and close automatically when the action is finished.

## What will change
- Add a blocking progress view inside the Create New Order modal after the user clicks an action.
- Show action-specific messages:
  - **Creating order...** while the order is being saved and follow-up actions run.
  - **Sending offer...** while the offer is saved and emailed.
- Prevent closing or double-clicking while the action is running, so duplicate orders/offers are less likely.
- After success, switch the progress view to a short success confirmation such as:
  - **Order created successfully**
  - **Offer sent successfully**
- Automatically close the success message and the Create New Order modal shortly after the successful action completes.
- If the main action fails, show the existing error feedback and keep the modal open so the user can fix or retry.

## Technical details
- Update only `CreateOrderModal.tsx` unless a tiny reusable helper is clearly needed.
- Add a local modal state for the current action: idle, working, success, error.
- Reuse the existing `isSubmitting` and `isSendingOffer` guards for disabled buttons.
- Keep current order creation, email, offer, VAT, inventory, and notification behavior unchanged.
- Replace the final success toast for create/send with the in-modal success state, while keeping warning/error toasts for partial failures.
- Ensure cleanup resets the success/loading state when the modal closes.

## Validation
- Confirm Create Order shows the progress view, then success, then closes.
- Confirm Send Offer shows the progress view, then success, then closes.
- Confirm validation errors still stay on the form.
- Run the project type check after the change.
