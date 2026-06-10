
-- 1) Add engagement metrics to checklist items
ALTER TABLE public.social_media_checklist_items
  ADD COLUMN IF NOT EXISTS likes integer,
  ADD COLUMN IF NOT EXISTS shares integer,
  ADD COLUMN IF NOT EXISTS comments integer,
  ADD COLUMN IF NOT EXISTS reach integer,
  ADD COLUMN IF NOT EXISTS impressions integer,
  ADD COLUMN IF NOT EXISTS performance_note text,
  ADD COLUMN IF NOT EXISTS performance_recorded_at timestamptz;

-- 2) Content ideas backlog
CREATE TABLE IF NOT EXISTS public.social_media_content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook','abm_website','instagram','tiktok','twitter')),
  title text NOT NULL,
  description text,
  link_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','used','archived')),
  used_on_date date,
  used_item_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_content_ideas TO authenticated;
GRANT ALL ON public.social_media_content_ideas TO service_role;

ALTER TABLE public.social_media_content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and agents can view ideas"
  ON public.social_media_content_ideas FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "Admins and agents can insert ideas"
  ON public.social_media_content_ideas FOR INSERT
  TO authenticated
  WITH CHECK ((public.is_admin() OR public.get_auth_user_role() IN ('admin','agent')) AND created_by = auth.uid());

CREATE POLICY "Admins and agents can update ideas"
  ON public.social_media_content_ideas FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "Admins or creators can delete ideas"
  ON public.social_media_content_ideas FOR DELETE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_smci_platform_status ON public.social_media_content_ideas(platform, status, created_at DESC);

CREATE TRIGGER smci_set_updated_at
  BEFORE UPDATE ON public.social_media_content_ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Best times to post
CREATE TABLE IF NOT EXISTS public.social_media_best_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook','abm_website','instagram','tiktok','twitter')),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour smallint NOT NULL CHECK (hour BETWEEN 0 AND 23),
  source text NOT NULL DEFAULT 'default' CHECK (source IN ('default','computed','manual')),
  score numeric NOT NULL DEFAULT 0,
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, day_of_week, hour, source)
);

GRANT SELECT ON public.social_media_best_times TO authenticated;
GRANT ALL ON public.social_media_best_times TO service_role;

ALTER TABLE public.social_media_best_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view best times"
  ON public.social_media_best_times FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage best times"
  ON public.social_media_best_times FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed defaults (industry rules of thumb). day_of_week: 0=Sun..6=Sat
-- Facebook: Tue-Thu 9, 13, 15
INSERT INTO public.social_media_best_times (platform, day_of_week, hour, source, score, note) VALUES
  ('facebook',2,9,'default',1,'Mid-morning peak'),
  ('facebook',2,13,'default',1,'Lunch peak'),
  ('facebook',2,15,'default',1,'Afternoon peak'),
  ('facebook',3,9,'default',1,NULL),('facebook',3,13,'default',1,NULL),('facebook',3,15,'default',1,NULL),
  ('facebook',4,9,'default',1,NULL),('facebook',4,13,'default',1,NULL),('facebook',4,15,'default',1,NULL),
  -- Instagram: Mon-Fri 11, 14, 19
  ('instagram',1,11,'default',1,NULL),('instagram',1,14,'default',1,NULL),('instagram',1,19,'default',1,NULL),
  ('instagram',2,11,'default',1,NULL),('instagram',2,14,'default',1,NULL),('instagram',2,19,'default',1,NULL),
  ('instagram',3,11,'default',1,NULL),('instagram',3,14,'default',1,NULL),('instagram',3,19,'default',1,NULL),
  ('instagram',4,11,'default',1,NULL),('instagram',4,14,'default',1,NULL),('instagram',4,19,'default',1,NULL),
  ('instagram',5,11,'default',1,NULL),('instagram',5,14,'default',1,NULL),('instagram',5,19,'default',1,NULL),
  -- TikTok: Tue, Thu, Fri 18-22
  ('tiktok',2,18,'default',1,NULL),('tiktok',2,20,'default',1,NULL),('tiktok',2,22,'default',1,NULL),
  ('tiktok',4,18,'default',1,NULL),('tiktok',4,20,'default',1,NULL),('tiktok',4,22,'default',1,NULL),
  ('tiktok',5,18,'default',1,NULL),('tiktok',5,20,'default',1,NULL),('tiktok',5,22,'default',1,NULL),
  -- Twitter: weekdays 8, 12, 17
  ('twitter',1,8,'default',1,NULL),('twitter',1,12,'default',1,NULL),('twitter',1,17,'default',1,NULL),
  ('twitter',2,8,'default',1,NULL),('twitter',2,12,'default',1,NULL),('twitter',2,17,'default',1,NULL),
  ('twitter',3,8,'default',1,NULL),('twitter',3,12,'default',1,NULL),('twitter',3,17,'default',1,NULL),
  ('twitter',4,8,'default',1,NULL),('twitter',4,12,'default',1,NULL),('twitter',4,17,'default',1,NULL),
  ('twitter',5,8,'default',1,NULL),('twitter',5,12,'default',1,NULL),('twitter',5,17,'default',1,NULL),
  -- ABM website (blog): weekdays 10, 14
  ('abm_website',1,10,'default',1,NULL),('abm_website',1,14,'default',1,NULL),
  ('abm_website',2,10,'default',1,NULL),('abm_website',2,14,'default',1,NULL),
  ('abm_website',3,10,'default',1,NULL),('abm_website',3,14,'default',1,NULL),
  ('abm_website',4,10,'default',1,NULL),('abm_website',4,14,'default',1,NULL),
  ('abm_website',5,10,'default',1,NULL),('abm_website',5,14,'default',1,NULL)
ON CONFLICT (platform, day_of_week, hour, source) DO NOTHING;
