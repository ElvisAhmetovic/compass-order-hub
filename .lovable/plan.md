
## Fix: Clients Accessing Internal Messaging

### Root Cause
Three client accounts (Lighttec GmbH, Atwi Automobile, Najam Oplate Sarajevo) have `role = 'client'` in `profiles` but **no entry in `user_roles`**. The AuthContext defaults to `'user'` when no `user_roles` record is found, so these clients bypass `RequireAuth`'s client redirect and can access all internal pages including messaging.

### Fix (3 parts)

**1. Database migration — Insert missing `user_roles` entries**
Add the 3 missing client role records so these users are properly identified as clients:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'client'::app_role FROM profiles 
WHERE role = 'client' 
AND id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT DO NOTHING;
```

**2. `src/context/AuthContext.tsx` — Fallback to profile role**
When no `user_roles` entry exists, instead of defaulting to `'user'`, check `profiles.role` as a secondary fallback. This prevents future cases where a client without a `user_roles` entry gets elevated access.

Change lines 79-103: If `roleData` is null, query `profiles.role` and use that before falling back to `'user'`.

**3. `src/components/messaging/InternalChat.tsx` — Filter out clients from team members**
Add `.neq('role', 'client')` to the team members query (line 60) so clients never appear in the internal chat participant list. Also filter notifications (line 158) to exclude client profiles.

### Files
- **Migration SQL** — fix the 3 missing user_roles entries
- `src/context/AuthContext.tsx` — safer role fallback
- `src/components/messaging/InternalChat.tsx` — exclude clients from team members and notifications
