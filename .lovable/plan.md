

## Remove "No thanks" Button from Client Credential Dialog

Remove the `AlertDialogCancel` ("No thanks") button from the credential request dialog in `ClientLogin.tsx`. The dialog will only have the "Send My Login Info" action button. Clicking outside or pressing Escape will still dismiss it naturally.

### File: `src/pages/client/ClientLogin.tsx`
- Remove the `AlertDialogCancel` button from the `AlertDialogFooter`
- Remove the `handleDismissCredentialDialog` function (no longer needed as a click handler)
- Keep the `onOpenChange` on `AlertDialog` to handle dismiss via overlay/escape, clearing the query param

