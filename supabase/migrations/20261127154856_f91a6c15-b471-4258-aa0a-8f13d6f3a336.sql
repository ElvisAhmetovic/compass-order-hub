ALTER TABLE public.assistant_knowledge ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'chat';
ALTER TABLE public.assistant_knowledge ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'fact';