# Make Company Information editable in invoice Template Settings

## What's wrong (confirmed in code)
1. **Clearing a field snaps it back.** If the Company Name is emptied, the settings immediately reload the defaults, so you can't delete and retype it.
2. **Address box fights the typing.** The single Address box is rebuilt from street / postal+city / country on every keystroke. Four updates fire at once and each overwrites the previous one, so street, postal and city get wiped; spaces and new lines get eaten.
3. **Saved info is never loaded back.** The company info saved to the database is never read when the page opens, so it always shows the built-in defaults — edits seem to "not stick".
4. It saves to the database on every single keystroke, which adds lag and errors.

## Fix
- Replace the one Address box with separate fields: **Street, Postal code, City, Country** (plus keep Name, Contact Person, Email, Phone, Registration Number, VAT ID; add Website, Tax Number, Director which exist but aren't shown).
- Every field can be freely cleared, edited or filled — no snapping back to defaults.
- Load the saved company info from the database when Template Settings opens.
- Save automatically ~1 second after typing stops, with a small "Saved" indicator (and an error message if saving fails).
- Invoice preview and PDF keep using these values (empty fields are simply left out).

## Technical details
- `useInvoiceSettings.ts`: use functional `setSettings(prev => …)` in `updateCompanyInfo`; remove the "name empty → reset to getCompanyInfo()" effect; call `loadCompanyInfo()` on mount and merge; debounce `saveCompanyInfo` (1s).
- `CompanyInformation.tsx`: split address into 4 inputs; add website/taxNumber/director inputs.
- Check `InvoicePreview` / PDF generator handle blank fields without printing stray separators.
- QA: typecheck + tests; add a unit test for `updateCompanyInfo` (multiple fields, clearing name). Browser click-through needs your check (my test browser can't log in).
