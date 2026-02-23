

## Make Ticket Confirmation Page Look Professional

### Problem
When a client clicks "Need Help? Open a Ticket," they land on a Supabase function URL (`https://xxx.supabase.co/functions/v1/create-client-ticket?...`) showing a basic HTML page. The URL looks technical and the page feels unbranded.

### Solution
Instead of returning raw HTML from the edge function, **redirect the client to a branded confirmation page** on the main app after the ticket is created. This way:
- The URL will be `https://www.empriadental.de/ticket-submitted` (clean and professional)
- The page will match the app's design and branding
- Error/duplicate cases also get nice pages

### Changes

**1. Update Edge Function (`supabase/functions/create-client-ticket/index.ts`)**
- After successfully creating the ticket, return a `302 redirect` to `https://www.empriadental.de/ticket-submitted?company=CompanyName&status=success`
- For duplicate tickets, redirect to `?status=duplicate`
- For errors, redirect to `?status=error`

**2. Create New Page (`src/pages/TicketSubmitted.tsx`)**
- A clean, branded confirmation page that reads the `status` and `company` query params
- Shows a success message with the company name, or appropriate messages for duplicate/error states
- Styled to match the app's existing design (no login required)
- Includes a friendly message like "Our team has been notified and will contact you shortly"

**3. Add Route (`src/App.tsx`)**
- Add `/ticket-submitted` as a public route (no auth required)

### Technical Details

| File | Change |
|------|--------|
| `supabase/functions/create-client-ticket/index.ts` | Replace HTML responses with 302 redirects to the app |
| `src/pages/TicketSubmitted.tsx` | New branded confirmation page |
| `src/App.tsx` | Add public route for `/ticket-submitted` |

