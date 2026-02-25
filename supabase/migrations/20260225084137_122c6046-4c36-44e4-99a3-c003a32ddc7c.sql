DROP POLICY "Users can insert own work hours" ON public.work_hours;
CREATE POLICY "Users can insert own work hours"
ON public.work_hours FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));