

# Fix: Features Not Working on Live/Published Site

## Root Cause Analysis

Two separate issues are preventing features from working on the published site (`compass-order-hub.lovable.app`):

### Problem 1: "Failed to fetch" on Order Creation and Other Actions

Multiple components call Supabase Edge Functions using raw `fetch()` instead of the Supabase SDK's `supabase.functions.invoke()`. This causes CORS preflight failures on the live site because:

- The browser sends additional headers (like `x-supabase-client-platform`) that aren't listed in the edge function's `Access-Control-Allow-Headers`
- One edge function (`create-tech-support-ticket`) has a hardcoded allowlist of origins that **does not include** your published URL (`compass-order-hub.lovable.app`)
- In the Lovable editor preview, the iframe context is more lenient with CORS

**Affected files (5 files with raw `fetch()` calls):**
- `src/components/dashboard/CreateOrderModal.tsx` (line 378)
- `src/components/dashboard/OrderEditForm/useOrderEdit.ts` (line 190)
- `src/services/statusChangeNotificationService.ts` (line 46)
- `src/components/tech-support/CreateTechSupportModal.tsx` (line 105)
- `src/components/tech-support/CreateTechSupportWithImageModal.tsx` (line 95)

### Problem 2: Autofill Dropdown Not Scrollable/Clickable

The "Search existing orders" dropdown (`OrderSearchDropdown`) uses a Radix `Popover` rendered inside a Radix `Dialog` (the Create Order modal). On the live site, the popover's scroll area and click events are blocked because:

- The Dialog's focus trap prevents interaction with the Popover content
- The Popover portal may render behind the Dialog overlay due to z-index stacking

---

## Implementation Plan

### Step 1: Replace all raw `fetch()` calls with `supabase.functions.invoke()`

The Supabase SDK handles CORS, auth tokens, and headers automatically. This is the correct way to call edge functions from the frontend.

**For each of the 5 affected files**, replace the pattern:

```typescript
// BEFORE (broken on live site)
const response = await fetch(
  `https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/send-order-confirmation`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer <key>`,
    },
    body: JSON.stringify(payload),
  }
);
const result = await response.json();
```

With:

```typescript
// AFTER (works everywhere)
const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
  body: payload,
});
if (error) throw error;
```

**Files to change:**

| File | Edge Function Called |
|------|---------------------|
| `CreateOrderModal.tsx` | `send-order-confirmation` |
| `useOrderEdit.ts` | `send-order-confirmation` |
| `statusChangeNotificationService.ts` | `send-status-change-notification` |
| `CreateTechSupportModal.tsx` | `create-tech-support-ticket` |
| `CreateTechSupportWithImageModal.tsx` | `create-tech-support-ticket` |

### Step 2: Update all edge function CORS headers

Update every edge function to use the complete set of headers that the Supabase client sends:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

**All 23 edge functions** will be updated for consistency.

Special case: `create-tech-support-ticket` currently has a hardcoded origin allowlist missing `compass-order-hub.lovable.app`. We'll switch it to use `*` like all the other functions (since auth is handled via the JWT token, not CORS origin).

### Step 3: Fix the autofill dropdown inside the modal

Update `OrderSearchDropdown.tsx` to ensure the Popover content renders above the Dialog:

- Add explicit `z-[100]` class to `PopoverContent` (higher than Dialog's `z-50`)
- Add `onOpenAutoFocus={(e) => e.preventDefault()}` to prevent focus stealing
- Ensure `ScrollArea` has proper pointer-events

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/CreateOrderModal.tsx` | Replace raw `fetch()` with `supabase.functions.invoke()` |
| `src/components/dashboard/OrderEditForm/useOrderEdit.ts` | Replace raw `fetch()` with `supabase.functions.invoke()` |
| `src/services/statusChangeNotificationService.ts` | Replace raw `fetch()` with `supabase.functions.invoke()` |
| `src/components/tech-support/CreateTechSupportModal.tsx` | Replace raw `fetch()` with `supabase.functions.invoke()` |
| `src/components/tech-support/CreateTechSupportWithImageModal.tsx` | Replace raw `fetch()` with `supabase.functions.invoke()` |
| `src/components/dashboard/OrderSearchDropdown.tsx` | Fix z-index and focus handling for Popover inside Dialog |
| All 23 edge functions in `supabase/functions/` | Standardize CORS headers |

## Expected Outcome

After these changes:
1. Order creation, status changes, and tech support ticket creation will work on the live published site
2. The autofill dropdown will be scrollable and clickable inside the modal on both editor and live site
3. All edge function calls will be more robust and consistent

