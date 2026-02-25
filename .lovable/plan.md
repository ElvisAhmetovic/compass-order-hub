

## Change Sidebar Clock from Sarajevo to Duisburg (Germany)

### Change

Update the clock label and timezone in `src/components/dashboard/Sidebar.tsx` from "Europe/Sarajevo" to "Europe/Berlin" (Duisburg uses the same timezone as Berlin — CET/CEST), and change the label from "Sarajevo" to "Duisburg, Germany".

### File

| File | Change |
|------|--------|
| `src/components/dashboard/Sidebar.tsx` | Replace all 3 occurrences of `'Europe/Sarajevo'` with `'Europe/Berlin'`, and change the label text from `Sarajevo` to `Duisburg, Germany` |

