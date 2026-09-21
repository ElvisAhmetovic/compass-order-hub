# Improve the Create New Order window

## Changes

1. **Close by clicking outside**
   - Allow the Create New Order window to close when its shaded backdrop is clicked.
   - Keep the existing X and Cancel controls working.
   - Apply this only to the Create New Order window, without changing other dialogs.

2. **Collapse additional email notifications**
   - Replace the always-visible additional-email area with a compact expandable row.
   - Keep it closed by default each time the window opens.
   - Show a clear expand/collapse indicator and preserve all existing default-email, add-email, edit, and remove behavior inside it.

3. **Align offer controls**
   - Move the Offer language selector into the main bottom action row beside Cancel, Send Offer, and Create Order.
   - Align the selector and buttons consistently.
   - Put the small “Offer language” text underneath its selector so it no longer shifts the row off-center.
   - Let the controls wrap cleanly on narrow screens.

## Verification

- Confirm backdrop click, X, and Cancel all close the window.
- Confirm the email section starts closed and all email controls still work after opening it.
- Confirm Send Offer uses the selected language and Create Order is unchanged.
- Check the bottom controls at desktop and narrow widths.
- Run the relevant automated checks and TypeScript validation.
