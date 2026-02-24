

## Fix Client Ticket Flow: Loading Page + Background Emails

### Two Problems

1. **Ugly Supabase URL visible while waiting**: When the client clicks "Need Help?", they're taken directly to the Edge Function URL (something like `https://xyz.supabase.co/functions/v1/create-client-ticket?orderId=...`). The function takes 5-10 seconds to send all 11 team emails before redirecting. During that time, the client sees the raw Supabase URL with code/JSON in the browser.

2. **Slow response**: The function sends emails sequentially (11 emails x 500ms delay = ~5.5 seconds minimum) before redirecting the client.

### Solution

**Two changes:**

#### 1. Edge Function: Redirect immediately, send emails in the background

Restructure `create-client-ticket/index.ts` so that after inserting the ticket, it redirects the client to the success page **immediately**. Move all email sending and notification creation to run in the background using Deno's non-blocking pattern (fire-and-forget promises that complete after the response is sent).

The flow becomes:
- Validate request, check duplicates, insert ticket (~200ms)
- Return redirect to `/ticket-submitted?status=success` immediately
- Emails and notifications continue processing in the background

#### 2. New intermediate loading page

Create a new page `/ticket-loading` that the email "Need Help?" link points to instead of the raw Edge Function URL. This page:
- Shows a branded loading spinner with "Submitting your request..." message
- Calls the Edge Function via `fetch()` from the browser
- On success, navigates to `/ticket-submitted?status=success`
- On error, navigates to `/ticket-submitted?status=error`

This way the client never sees the Supabase URL -- they only see your branded app pages.

**Wait -- simpler approach:** Actually, since we can make the Edge Function redirect instantly by backgrounding the emails, we can just show a loading state on the `TicketSubmitted` page itself. But the client still sees the Supabase URL briefly during the redirect...

**Best approach: Intermediate loading page.** The email link goes to `/ticket-loading?orderId=X&email=Y` on your domain. That page shows a nice loader, calls the edge function, then shows the result. The edge function changes from returning redirects to returning JSON responses.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/TicketLoading.tsx` | **New file.** Branded loading page that reads `orderId` and `email` from URL params, calls the edge function via fetch, then navigates to `/ticket-submitted` with the result. Shows a spinner with "Submitting your support request..." |
| `src/App.tsx` | Add route for `/ticket-loading` |
| `supabase/functions/create-client-ticket/index.ts` | Two changes: (1) Return JSON responses instead of 302 redirects when called with a specific header or method. (2) Move email sending to background (fire-and-forget) so response returns in ~200ms. Keep the redirect behavior as fallback for direct URL access. |
| Status change email templates (where the "Need Help?" link is generated) | Update the link from the raw Supabase function URL to `APP_URL/ticket-loading?orderId=X&email=Y` |

### Implementation Detail

**TicketLoading.tsx:**
```tsx
// Shows branded loading UI
// On mount: fetch edge function with POST + JSON body
// On response: navigate to /ticket-submitted?status=success|error|duplicate
```

**Edge Function changes:**
- Accept POST requests with JSON body `{ orderId, email }`
- For POST: return JSON `{ status: "success"|"error"|"duplicate", company: "..." }`
- Background the email loop (don't await it before responding)
- Keep GET+redirect as fallback

**Email template link change:**
```
Old: https://supabase-url/functions/v1/create-client-ticket?orderId=X&email=Y
New: https://www.empriadental.de/ticket-loading?orderId=X&email=Y
```

### Technical Details - Background Email Pattern

```ts
// Instead of awaiting the email loop:
const emailPromise = (async () => {
  for (const recipient of NOTIFICATION_EMAILS) {
    try { await resend.emails.send({...}); } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
})();
// Don't await emailPromise -- it runs after response is sent

return new Response(JSON.stringify({ status: "success", company: order.company_name }), {
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});
```

