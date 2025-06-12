
-- Check if RLS is enabled on messages table and add proper policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to delete messages (for admins and message senders)
CREATE POLICY "Allow message deletion" ON public.messages
FOR DELETE
USING (
  -- Allow if user is admin
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Allow if user is the sender of the message
  sender_id = auth.uid()
);

-- Create policy to allow users to select messages
CREATE POLICY "Allow message viewing" ON public.messages
FOR SELECT
USING (true); -- Allow all authenticated users to view messages

-- Create policy to allow users to insert messages
CREATE POLICY "Allow message creation" ON public.messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Create policy to allow users to update their own messages
CREATE POLICY "Allow message updates" ON public.messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());
