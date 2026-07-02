Make the "AB Media Team CRM" sidebar title a clickable external link to https://www.abm-team.com/en, opened in a new tab.

1. Edit `src/components/dashboard/Sidebar.tsx` line 296.
   - Wrap the current `<h2 className="text-xl font-semibold text-foreground">AB Media Team CRM</h2>` in an `<a>` element.
   - Set `href="https://www.abm-team.com/en"`.
   - Add `target="_blank"` and `rel="noopener noreferrer"` for safe external navigation.
   - Keep existing styling (`text-xl font-semibold text-foreground`) and add hover/focus cues so it looks clickable.

2. Verify the change is the only place the title appears (confirmed via search: only `Sidebar.tsx:296`).

3. Run the project typecheck/build to ensure no compile errors.

No other UI or business logic changes.