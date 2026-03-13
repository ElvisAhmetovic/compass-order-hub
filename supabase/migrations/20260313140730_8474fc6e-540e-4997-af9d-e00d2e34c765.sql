
-- Harden messages RLS: block clients from sending/viewing internal messages
DROP POLICY IF EXISTS "Allow message creation" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Non-client users can send messages" ON public.messages
  FOR INSERT TO public
  WITH CHECK (auth.uid() = sender_id AND NOT public.is_client());

DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;

CREATE POLICY "Non-client users can view messages" ON public.messages
  FOR SELECT TO public
  USING (
    NOT public.is_client()
  );

-- Harden channels RLS: block clients from creating/viewing channels
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;

CREATE POLICY "Non-client users can create channels" ON public.channels
  FOR INSERT TO public
  WITH CHECK (auth.uid() = created_by AND NOT public.is_client());

DROP POLICY IF EXISTS "Users can view channels they participate in" ON public.channels;
DROP POLICY IF EXISTS "Users can view channels" ON public.channels;

CREATE POLICY "Non-client users can view channels" ON public.channels
  FOR SELECT TO public
  USING (
    NOT public.is_client()
  );

-- Also block DELETE for clients on messages
DROP POLICY IF EXISTS "Users can delete messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Non-client users can delete messages" ON public.messages
  FOR DELETE TO public
  USING (NOT public.is_client());
