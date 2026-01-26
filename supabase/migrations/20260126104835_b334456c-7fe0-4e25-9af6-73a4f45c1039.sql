-- Add DELETE policies for support tables (admin only)

-- Allow admins to delete support inquiries
CREATE POLICY "Admins can delete support inquiries"
ON public.support_inquiries
FOR DELETE
USING (is_admin());

-- Allow admins to delete support replies
CREATE POLICY "Admins can delete support replies"
ON public.support_replies
FOR DELETE
USING (is_admin());

-- Also add UPDATE policy for support_inquiries status changes
CREATE POLICY "Users and admins can update inquiries"
ON public.support_inquiries
FOR UPDATE
USING (auth.uid() = user_id OR is_admin());