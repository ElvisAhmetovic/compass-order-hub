

## Fix: Tech Support Ticket CORS Crash on Live Site

### Root Cause

In `supabase/functions/create-tech-support-ticket/index.ts`, line 42 references an undefined variable `origin`:

```typescript
console.log('Handling OPTIONS preflight request from origin:', origin);
//                                                             ^^^^^^ NOT DEFINED
```

This causes a **runtime crash** in the OPTIONS preflight handler. Since the handler crashes, no `Access-Control-Allow-Origin` header is returned, and the browser blocks the request with a CORS error.

The CORS headers themselves are correct -- the function just never gets to return them because it crashes first.

### Fix

**File:** `supabase/functions/create-tech-support-ticket/index.ts`

Replace the broken `console.log` on line 42 with one that reads the origin from the request headers:

```typescript
// BEFORE (crashes - 'origin' is undefined)
console.log('Handling OPTIONS preflight request from origin:', origin);

// AFTER (works)
console.log('Handling OPTIONS preflight request from origin:', req.headers.get('origin'));
```

That is the only change needed. After this fix, the edge function will be redeployed automatically, and both "Create Ticket" and "Create Ticket with Image" will work on `empriatech.com` and `compass-order-hub.lovable.app`.

### Why it only fails on the live site

In the Lovable editor preview, requests go through a proxy that may handle CORS differently. On the real published domains (`empriatech.com`, `compass-order-hub.lovable.app`), the browser sends a proper OPTIONS preflight that hits this crash.

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/create-tech-support-ticket/index.ts` (line 42) | Fix undefined `origin` variable reference |

