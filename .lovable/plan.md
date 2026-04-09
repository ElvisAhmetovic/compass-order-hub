

## Increase Default Orders Per Page to 30

### Change
In `src/components/dashboard/OrderTable.tsx`, line 47, change the default `rowsPerPage` from `10` to `30`.

```typescript
// Before
const [rowsPerPage] = useState(10);

// After
const [rowsPerPage] = useState(30);
```

That's it — one line change. All pagination math (`totalPages`, `indexOfFirstOrder`, `indexOfLastOrder`) already derives from `rowsPerPage`, so everything adjusts automatically.

### File to modify
1. `src/components/dashboard/OrderTable.tsx` — line 47

