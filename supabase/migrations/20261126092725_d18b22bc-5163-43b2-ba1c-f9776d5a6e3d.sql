DROP POLICY IF EXISTS "Anyone can view achievement definitions" ON public.achievement_definitions;
CREATE POLICY "Team can view achievement definitions" ON public.achievement_definitions FOR SELECT TO authenticated USING (public.is_team());

DROP POLICY IF EXISTS "Anyone can read sidebar config" ON public.sidebar_config;
CREATE POLICY "Team can read sidebar config" ON public.sidebar_config FOR SELECT TO authenticated USING (public.is_team());

DROP POLICY IF EXISTS "Auth can view best times" ON public.social_media_best_times;
CREATE POLICY "Team can view best times" ON public.social_media_best_times FOR SELECT TO authenticated USING (public.is_team());

DROP POLICY IF EXISTS "Anyone can view team challenges" ON public.team_challenges;
CREATE POLICY "Team can view team challenges" ON public.team_challenges FOR SELECT TO authenticated USING (public.is_team());

DROP POLICY IF EXISTS "Authenticated users can view all upsells" ON public.upsells;
DROP POLICY IF EXISTS "Users can create their own upsells" ON public.upsells;
CREATE POLICY "Team can view upsells" ON public.upsells FOR SELECT TO authenticated USING (public.is_team());
CREATE POLICY "Team can create own upsells" ON public.upsells FOR INSERT TO authenticated WITH CHECK (public.is_team() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create upsell categories" ON public.upsell_categories;
DROP POLICY IF EXISTS "Authenticated users can delete upsell categories" ON public.upsell_categories;
DROP POLICY IF EXISTS "Authenticated users can view upsell categories" ON public.upsell_categories;
CREATE POLICY "Team can view upsell categories" ON public.upsell_categories FOR SELECT TO authenticated USING (public.is_team());
CREATE POLICY "Team can create upsell categories" ON public.upsell_categories FOR INSERT TO authenticated WITH CHECK (public.is_team());
CREATE POLICY "Team can delete upsell categories" ON public.upsell_categories FOR DELETE TO authenticated USING (public.is_team());

DROP POLICY IF EXISTS "Authenticated users can insert translations" ON public.upsell_translations;
DROP POLICY IF EXISTS "Authenticated users can view translations" ON public.upsell_translations;
CREATE POLICY "Team can view translations" ON public.upsell_translations FOR SELECT TO authenticated USING (public.is_team());
CREATE POLICY "Team can insert translations" ON public.upsell_translations FOR INSERT TO authenticated WITH CHECK (public.is_team());

DROP POLICY IF EXISTS "Authenticated users can view reactions" ON public.reactions;
CREATE POLICY "Team can view reactions" ON public.reactions FOR SELECT TO authenticated USING (public.is_team());

DROP POLICY IF EXISTS "Authenticated users can view reminder logs" ON public.payment_reminder_logs;
CREATE POLICY "Team can view reminder logs" ON public.payment_reminder_logs FOR SELECT TO authenticated USING (public.is_team());

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.companies;
CREATE POLICY "Team can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.is_team());

DROP POLICY IF EXISTS "Authenticated users can create proposals" ON public.proposals;
CREATE POLICY "Team can create proposals" ON public.proposals FOR INSERT TO authenticated WITH CHECK (public.is_team());

DROP POLICY IF EXISTS "Service role can insert customer tickets" ON public.customer_tickets;