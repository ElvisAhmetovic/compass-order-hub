ALTER TABLE public.social_media_platform_metrics
  ADD COLUMN IF NOT EXISTS clicks integer,
  ADD COLUMN IF NOT EXISTS ctr numeric(5,2),
  ADD COLUMN IF NOT EXISTS avg_position numeric(5,2),
  ADD COLUMN IF NOT EXISTS users integer,
  ADD COLUMN IF NOT EXISTS sessions integer;