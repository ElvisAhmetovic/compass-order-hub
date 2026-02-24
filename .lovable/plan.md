

## Fix Login Redirect Flow

### Problem
After logging in, the toast says "Login successful" but the user stays on `/login`. The redirect logic in `LoginForm.tsx` uses a fragile `setTimeout` with manual Supabase queries that race against the AuthContext state update, often failing silently.

### Root Cause
`LoginForm.tsx` tries to handle redirection itself with a `setTimeout` + manual role fetch, instead of letting the parent `Login.tsx` page react to the AuthContext `user` state change. Meanwhile, `Login.tsx` has zero redirect logic -- it just renders the form.

### Solution
Follow the same pattern that `ClientLogin.tsx` already uses successfully:

1. **`Login.tsx`** -- Add a `useEffect` that watches `user` from AuthContext. When `user` becomes non-null after login, redirect based on role (client -> `/client/dashboard`, others -> `/dashboard`). Also redirect immediately if user is already logged in when visiting `/login`.

2. **`LoginForm.tsx`** -- Remove the hacky `setTimeout` redirect logic. The `login()` function just returns `true`/`false` -- let the parent page handle navigation.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Login.tsx` | Add `useEffect` watching `user` from `useAuth()` to redirect on login. Redirect already-authenticated users immediately. |
| `src/components/auth/LoginForm.tsx` | Remove the `setTimeout` block and manual Supabase role-fetching after successful login. Keep only the `login()` call and error handling. |

### Why This Works
- The AuthContext `onAuthStateChange` listener already updates `user` with the correct role after `signInWithPassword` succeeds
- The `Login.tsx` `useEffect` fires when `user` changes from `null` to a valid user object
- No race conditions, no manual Supabase queries, no timeouts
- Matches the working pattern in `ClientLogin.tsx`

