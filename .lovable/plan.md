# Restrict editing to "today only" for workers

## Goal
On `/work-hours`, a regular worker/admin can only edit the row for **today**. Past days and future days are read-only — fields disabled, absent toggle disabled, submit button disabled. Super-admins (the 5 emails) keep full edit access on any date.

## Rule
For each row with date `iso`:
- `canEdit = isSuper || (iso === today && !isLocked)`
- Past days (`iso < today`) → fields disabled, tooltip "Past day — contact admin to edit"
- Future days (`iso > today`) → fields disabled, tooltip "Not yet — only today can be edited"
- Today, not locked → fully editable + submit button active
- Today, locked → already handled (locked styling)
- Super-admin → always editable, submit/unlock available

## Scope
Frontend only — `src/components/work-hours/WorkHoursTable.tsx`. Replace the existing `fieldsDisabled` derivation with a date-aware version and update the tooltip text accordingly. No DB or service changes.

## QA
1. As a regular worker: past day rows → all inputs greyed out, absent button disabled, submit button disabled with "Past day" tooltip.
2. Future day rows → same disabled state with "Not yet" tooltip.
3. Today's row → fully editable until they click Submit; then locks.
4. As super-admin (`luciferbebistar@gmail.com`): every row editable on any date, can still submit/unlock.
