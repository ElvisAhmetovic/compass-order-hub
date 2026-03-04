

## Add Confirmation Dialog to Enhanced Sync Button

### What
Add an AlertDialog that pops up when "Enhanced Sync" is clicked, explaining exactly what the sync will do before the user confirms.

### Changes

**`src/pages/Companies.tsx`**
- Import `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` from `@/components/ui/alert-dialog`
- Wrap the Enhanced Sync `<Button>` with `<AlertDialog>` + `<AlertDialogTrigger asChild>`
- Add `<AlertDialogContent>` with:
  - **Title**: "Confirm Enhanced Sync"
  - **Description**: Clear explanation of the 3 things it does:
    1. Creates new companies from orders that don't have a matching company yet
    2. Creates new companies from invoice clients that don't have a matching company yet
    3. May create placeholder orders (price €0, status "Created") for clients without existing orders
  - Warning that this cannot be easily undone
- Confirm button calls the existing `handleEnhancedSync()`, cancel dismisses

No new files needed — just one file modified.

