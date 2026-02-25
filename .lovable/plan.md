

## Add Day Name to Sidebar Clock

### Change

**`src/components/dashboard/Sidebar.tsx`** — Update the date display line (around line 156) to include the weekday name.

Current:
```
14:32:05
25.02.2026 · Duisburg, Germany
```

New:
```
14:32:05
Wednesday, 25.02.2026 · Duisburg, Germany
```

Single line change: add `weekday: 'long'` to the `toLocaleDateString` options so the day name (Montag, Dienstag, etc. in German locale — or we can use English locale for the weekday) appears before the date.

