ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS expires_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON public.offers (expires_at);