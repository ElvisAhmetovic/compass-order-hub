

## Fix: Drop Ambiguous `generate_invoice_number` Overload

### Problem
Two database functions named `generate_invoice_number` exist:
1. `generate_invoice_number(prefix_param text)` — simple version
2. `generate_invoice_number(prefix_param text, year_param integer, sequence_param integer)` — extended version with defaults

PostgreSQL cannot resolve which to call, returning `PGRST203`.

### Fix
Drop the simple 1-parameter version. The 3-parameter version already handles single-argument calls via its default values (`year_param DEFAULT NULL`, `sequence_param DEFAULT NULL`).

### Changes
**New migration**: One SQL statement:
```sql
DROP FUNCTION IF EXISTS public.generate_invoice_number(text);
```

No frontend code changes needed.

