# Fix the Create Order success message

## What I found
- The preview redirects to the login page in the sandbox, so I cannot complete a real authenticated order creation from here without a signed-in test session.
- The browser logs show the Create Order window is producing dialog accessibility errors when opened.
- The current success/loading message is rendered as an overlay inside the Create Order window, while the original form stays mounted underneath it.

## Fix
1. Rework the Create Order window so the loading/success state is the actual visible dialog content, not an overlay placed on top of the form.
2. Add a proper title and description for both loading and success states so the dialog warning disappears.
3. Keep the window locked while the order or offer is actually being created/sent.
4. Show:
   - “Creating order...” while saving the order and preparing notifications.
   - “Order created successfully” for a short moment after the save finishes.
   - “Sending offer...” while saving and emailing the offer.
   - “Offer sent successfully” for a short moment after it finishes.
5. Keep errors on the form, with the existing error notification, so the user can correct and retry.
6. Close the Create Order window automatically only after the success message has been shown.

## Verification
- Re-run TypeScript checks.
- Re-run the automated tests that are available.
- Re-test the preview up to the login limitation and confirm the dialog warning is gone where possible.
- If a signed-in browser session becomes available, click through Create Order and Send Offer end to end and confirm the success screen appears before the window closes.
