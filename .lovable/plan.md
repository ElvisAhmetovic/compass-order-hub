

# Fix Authentication Routing Issues

## Overview
This plan addresses the routing bug identified in the security audit where the root route (`/`) sends all authenticated users to `/dashboard`, causing an unnecessary redirect hop for clients who are then corrected by `RequireAuth`.

---

## Issue Analysis

### Current Behavior (Bug)
```text
Client logs in → Index.tsx → /dashboard → RequireAuth → /client/dashboard
                              ↑                        ↑
                         redirect #1              redirect #2 (correction)
```

### Expected Behavior (Fixed)
```text
Client logs in → Index.tsx → /client/dashboard
                              ↑
                         single redirect based on role
```

---

## Implementation Plan

### Phase 1: Fix Index.tsx Role-Based Redirection

**File: `src/pages/Index.tsx`**

Update the redirect logic to check user role and send clients directly to their dashboard:

```typescript
useEffect(() => {
  console.log('Index page - Loading:', isLoading, 'User:', user?.email, 'Role:', user?.role);
  
  if (!isLoading) {
    if (user) {
      // Role-based redirection
      if (user.role === 'client') {
        console.log('Redirecting client to client dashboard');
        navigate("/client/dashboard");
      } else {
        console.log('Redirecting admin/agent/user to dashboard');
        navigate("/dashboard");
      }
    } else {
      console.log('Redirecting to login');
      navigate("/login");
    }
  }
}, [navigate, user, isLoading]);
```

**Changes:**
- Add role check before redirecting
- Clients (`role === 'client'`) go directly to `/client/dashboard`
- Admins, agents, and users go to `/dashboard`
- Add role to console log for debugging

---

## Manual Action Required: Supabase Postgres Upgrade

The Supabase linter detected that your Postgres database has security patches available. This cannot be fixed through code changes and requires manual action:

**Steps to apply the upgrade:**
1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Infrastructure**
3. Look for the **Postgres Version** section
4. Click **Upgrade** to apply the security patches
5. Schedule a maintenance window (the upgrade will cause brief downtime)

**Note:** This is a critical security update and should be applied as soon as possible to protect your database.

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `src/pages/Index.tsx` | Modify | Add role-based redirection for root route |

---

## Files to Modify

1. **`src/pages/Index.tsx`** - Update useEffect to check user role before redirecting

---

## Security Verification

After implementation, the routing behavior will be:

| User Role | Entry Point | Redirect To |
|-----------|-------------|-------------|
| Client | `/` | `/client/dashboard` (direct) |
| Admin | `/` | `/dashboard` (direct) |
| Agent | `/` | `/dashboard` (direct) |
| User | `/` | `/dashboard` (direct) |
| Not logged in | `/` | `/login` |

This eliminates the double-redirect for clients and provides a cleaner user experience.

