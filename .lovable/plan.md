

## Fix Profiles Role Escalation + jsPDF Vulnerability

### 1. Profiles — Remove Redundant UPDATE Policies (CRITICAL)

The protective `WITH CHECK` on "Profiles: allow update for resource owner" is nullified by other permissive UPDATE policies that lack role-change prevention. Since permissive policies OR together, any of the unprotected policies allows role changes.

**Fix**: Drop the redundant policies, keep only the one with the protective `WITH CHECK`.

```sql
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
```

The remaining policies will be:
- "Profiles: allow update for resource owner" — `USING (auth.uid() = id)` with `WITH CHECK` preventing role changes
- "Admins can update all profiles" — admin-only full access
- The `prevent_role_change` trigger as defense-in-depth backup

### 2. jsPDF — Upgrade to Patched Version

The advisory (GHSA-f8cm-6447-x5h2) is fixed in jspdf >= 2.5.2.

**Fix**: Update `package.json` from `^2.5.1` to `^2.5.2`.

### Files to Modify
- Database migration — drop 3 redundant UPDATE policies on `profiles`
- `package.json` — bump jspdf version

