

## Harden Client Isolation: Database-Level Enforcement

### Problem
The UI-level fixes (RequireAuth redirect, InternalChat filtering) are in place, but **the database RLS policies on `messages` and `channels` don't exclude clients**. A client with a valid Supabase session could bypass the UI and directly insert/read internal messages via the API. Defense in depth requires blocking at the DB layer too.

### Changes

**1. Database migration — Add client exclusion to messages and channels RLS**

Update the INSERT policies on `messages` to require the sender is NOT a client:
```sql
-- Drop and recreate the message insert policies to exclude clients
DROP POLICY IF EXISTS "Allow message creation" ON public.messages;
CREATE POLICY "Allow message creation" ON public.messages
  FOR INSERT TO public
  WITH CHECK (sender_id = auth.uid() AND NOT is_client());

DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Non-client users can send messages" ON public.messages
  FOR INSERT TO public
  WITH CHECK (auth.uid() = sender_id AND NOT is_client());
```

Update SELECT on messages to exclude clients from viewing internal channel messages:
```sql
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Non-client users can view messages" ON public.messages
  FOR SELECT TO public
  USING (
    NOT is_client() AND (
      auth.uid() = sender_id OR is_admin() OR (
        channel_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM channels
          WHERE channels.id = messages.channel_id
          AND (channels.created_by = auth.uid() OR auth.uid() = ANY(channels.participants))
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
```

Block clients from channels:
```sql
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
CREATE POLICY "Non-client users can create channels" ON public.channels
  FOR INSERT TO public
  WITH CHECK (auth.uid() = created_by AND NOT is_client());

DROP POLICY IF EXISTS "Users can view channels they participate in" ON public.channels;
CREATE POLICY "Non-client users can view channels" ON public.channels
  FOR SELECT TO public
  USING (
    NOT is_client() AND (
      auth.uid() = created_by OR auth.uid() = ANY(participants) OR type = 'general'
    )
  );
```

**2. `src/components/messaging/InternalChat.tsx` — Early return for client role**

Add a guard at the top of the component render: if `user.role === 'client'`, return an "Access denied" message. This is pure defense-in-depth since RequireAuth already redirects, but prevents any edge case.

### Files
- **Database migration** — harden messages + channels RLS with `NOT is_client()`
- `src/components/messaging/InternalChat.tsx` — add client role early return guard

