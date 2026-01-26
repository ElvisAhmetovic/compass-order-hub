-- Fix the last RLS Policy "Always True" warning on user_achievements

DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;

CREATE POLICY "Authenticated can insert achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);