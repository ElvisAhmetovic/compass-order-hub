

## Fix: Payment Reminders broken layout

### Problem
The `grid grid-cols-7 gap-4` layout breaks when client names are long (e.g., "Čistírna oděvů Daja - chemické čištění..."). Equal-width columns cause text overflow and misalignment.

### Solution
**File: `src/components/invoices/PaymentReminders.tsx`**

Replace the equal `grid-cols-7` with explicit column widths using `grid-template-columns` that give the client name column more space and constrain others:

```
grid grid-cols-[120px_1fr_100px_80px_100px_70px_auto]
```

- Invoice number: fixed `120px`
- Client name: flexible `1fr` (takes remaining space)
- Due date: `100px`
- Days overdue badge: `80px`
- Amount: `100px`
- Status: `70px`
- Actions: `auto`

Also add `truncate` / `line-clamp-2` on the client name to prevent extreme overflow, and add `min-w-0` on grid children to allow proper truncation within the grid.

