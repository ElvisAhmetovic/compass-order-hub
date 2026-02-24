

## Add Sarajevo Clock + Date Below Navigation

### What
A live clock showing Sarajevo time (Europe/Sarajevo timezone, CET/CEST) and the current date, displayed in the top-left area right under the "Navigation" heading in the sidebar.

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/Sidebar.tsx` | Add a live clock component below the "Navigation" `<h2>` in the sidebar header. Uses `setInterval` every second to update. Displays time in `HH:mm:ss` format and date in `DD.MM.YYYY` format, both using `toLocaleString('de-DE', { timeZone: 'Europe/Sarajevo' })`. |

### Implementation Detail

Inside `Sidebar.tsx`, add state for the current time and a `useEffect` with a 1-second interval. Render it in the `<div className="p-6">` block right after the "Navigation" heading:

```tsx
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);

// In the p-6 div, after the h2:
<div className="mt-2 text-sm text-gray-500">
  <div className="font-mono text-lg font-semibold text-gray-700">
    {currentTime.toLocaleTimeString('de-DE', { timeZone: 'Europe/Sarajevo' })}
  </div>
  <div className="text-xs">
    {currentTime.toLocaleDateString('de-DE', { timeZone: 'Europe/Sarajevo', day: '2-digit', month: '2-digit', year: 'numeric' })}
    {' · '}Sarajevo
  </div>
</div>
```

Single file change, no new dependencies needed.

