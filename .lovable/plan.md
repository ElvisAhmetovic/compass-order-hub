

## Use English Day Names in Sidebar Clock

### Change

**`src/components/dashboard/Sidebar.tsx`** (line 176) — Change the locale from `'de-DE'` to `'en-US'` for the date string so the weekday appears in English (e.g., "Wednesday" instead of "Mittwoch"). The time on line 173 can also be switched to `'en-US'` for consistency, though the 24h format will remain the same.

Result:
```
14:32:05
Wednesday, 25.02.2026 · Duisburg, Germany
```

Single line change.

