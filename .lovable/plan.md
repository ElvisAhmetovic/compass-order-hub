

## Fix Rate Limiting for Rapid Toggle Notifications

### Problem
When a user clicks both "Invoice Sent" and "Paid" toggles in quick succession, two separate `send-monthly-toggle-notification` edge function calls fire nearly simultaneously. Each sends to 12 team recipients (batched 2 at a time with 1s delays). Two concurrent invocations = 24 emails firing within overlapping windows, hitting Resend's rate limits and causing partial delivery failures.

### Solution
Create a client-side notification queue that serializes edge function calls. When multiple toggles are clicked rapidly, notifications are queued and sent one after another with a delay between them, instead of concurrently.

### Changes

**1. New file: `src/utils/notificationQueue.ts`**
A simple singleton queue that:
- Accepts notification payloads (edge function name + body)
- Processes them sequentially with a configurable delay (e.g. 8 seconds) between calls
- This ensures the first edge function's 12 emails finish sending before the next one starts
- Exposes `enqueueNotification(functionName, body)` function

```typescript
// Simplified concept:
const queue: Array<{fn: string, body: any}> = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const item = queue.shift();
    await supabase.functions.invoke(item.fn, { body: item.body });
    if (queue.length > 0) await delay(8000); // wait for previous batch to finish
  }
  processing = false;
}
```

**2. Modify: `src/components/monthly/MonthlyInstallmentsTable.tsx`**
- Replace direct `supabase.functions.invoke('send-monthly-toggle-notification', ...)` call in `sendToggleNotification` with `enqueueNotification('send-monthly-toggle-notification', body)`
- Import the queue utility

**3. Modify: `supabase/functions/send-monthly-toggle-notification/index.ts`**
- Increase batch delay from 1000ms to 1500ms for extra safety margin
- Reduce batch size from 2 to 1 email per batch for maximum rate limit protection

This approach is non-invasive — the toggle UI remains instant (optimistic), only the background email delivery is serialized.

