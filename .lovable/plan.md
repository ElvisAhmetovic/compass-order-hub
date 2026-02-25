

## Add Nickname Field to Work Hours User Selector

### What
Add a `nickname` column to the `profiles` table and display it under each admin/agent's name in the Work Hours employee selector dropdown, allowing admins to set a short descriptor for each user.

### Changes

**Database migration**: Add `nickname` column to `profiles` table.
```sql
ALTER TABLE public.profiles ADD COLUMN nickname text DEFAULT NULL;
```

**`src/services/workHoursService.ts`**: Update `fetchAllUsers` to also select the `nickname` column.

**`src/pages/WorkHours.tsx`**: Update the `SelectItem` rendering to show the nickname below the user's name in a smaller, muted style. Also add an inline editable nickname field — a small text input shown below the employee selector that lets admins set/update the nickname for the currently selected user.

**`src/integrations/supabase/types.ts`**: Will auto-update after migration.

### UI

The employee dropdown items will show:
```
John Doe
  Marketing Lead        ← nickname in smaller muted text
```

Below the selector, a small input field: "Nickname: [___________]" that saves on blur, letting admins quickly add or edit a nickname for the selected user.

