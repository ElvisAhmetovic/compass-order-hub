

# Fix: Login Succeeds But Stays on /login

## Root Cause

Two issues combine to cause this:

1. **No error handling in post-login redirect** (`LoginForm.tsx` lines 63-88): After `login()` returns `true`, a `setTimeout` callback runs async code (dynamic imports, DB queries) with NO try/catch. If anything throws, navigation silently fails.

2. **Login page doesn't redirect authenticated users**: Unlike the Index page which watches the `user` state and redirects, the Login page has no such logic. So even when `AuthContext` successfully sets the user via `onAuthStateChange`, the Login page just sits there.

## Fix

### 1. Add authenticated-user redirect to Login page (`src/pages/Login.tsx`)

Add a `useEffect` that watches the `user` from `useAuth()`. When `user` becomes non-null (either from a fresh login or an existing session), redirect based on role:
- `client` role --> `/client/dashboard`
- all others --> `/dashboard`

This is the same pattern used in `Index.tsx` and `ClientLogin.tsx`.

### 2. Simplify LoginForm redirect logic (`src/components/auth/LoginForm.tsx`)

Remove the fragile `setTimeout` + dynamic import + role query block entirely. Since Login.tsx now handles the redirect via `useEffect` watching the auth state, LoginForm only needs to:
- Call `login(email, password)`
- If it fails, show the error
- If it succeeds, do nothing -- the Login page's useEffect will handle navigation once AuthContext updates

This eliminates the unhandled promise rejection and the race condition.

## Files to modify

| File | Change |
|------|--------|
| `src/pages/Login.tsx` | Add `useAuth()` + `useEffect` to redirect when user is set |
| `src/components/auth/LoginForm.tsx` | Remove the `setTimeout` redirect block (lines 62-89), keep only the error handling |

## Why this is robust

- The redirect is driven by **AuthContext state**, not a fragile setTimeout chain
- Works for fresh logins AND page refreshes with existing sessions
- Matches the pattern already used by `Index.tsx` and `ClientLogin.tsx`
- No dynamic imports, no unhandled async errors

