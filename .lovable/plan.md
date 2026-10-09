# Director: Annalena Klein

- Change the Director (Geschäftsführer) from Andreas Berger to **Annalena Klein** on offers and monthly invoices, and in the saved company settings.
- Also fix the monthly invoices' contact person, which still says Andreas Berger, to Annalena Klein.

## Technical details
- Defaults in `src/utils/proposal/companyInfo.ts`, `src/services/companySettingsService.ts`, fallback in `src/utils/proposal/pdfGenerator.ts`, and `generate-monthly-installments` (director + contactPerson) → "Annalena Klein"; redeploy that function.
- Update the `company_settings` row: director = 'Annalena Klein'.
