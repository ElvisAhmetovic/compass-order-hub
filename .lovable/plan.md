

## Fix: Speed Up Team Notifications in send-invoice-pdf Edge Function

The `send-invoice-pdf` edge function sends 12 team notification emails **sequentially** with 500ms delays between each (total ~6+ seconds). The frontend waits for all of them to complete before showing the success toast.

### Fix

In `supabase/functions/send-invoice-pdf/index.ts`, replace the sequential `for` loop with `Promise.allSettled()` to send all team notifications **in parallel**. Resend's API can handle batch requests without the artificial 500ms delays for simple text-only notification emails (no attachments).

**Before** (sequential, ~6s):
```ts
for (const email of NOTIFICATION_EMAIL_LIST) {
  await fetch(...);
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

**After** (parallel, ~1s):
```ts
await Promise.allSettled(
  NOTIFICATION_EMAIL_LIST.map(email =>
    fetch('https://api.resend.com/emails', { ... })
      .then(res => { if (!res.ok) console.error(...); })
      .catch(e => console.error(...))
  )
);
```

### File to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-invoice-pdf/index.ts` | Replace sequential team email loop with `Promise.allSettled` for parallel sending |

