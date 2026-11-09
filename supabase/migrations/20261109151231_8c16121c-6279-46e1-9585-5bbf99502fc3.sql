CREATE TABLE public.order_payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  net_amount numeric NOT NULL,
  vat_enabled boolean NOT NULL DEFAULT false,
  vat_rate numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  stripe_link_id text,
  url text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_payment_links TO authenticated;
GRANT ALL ON public.order_payment_links TO service_role;
ALTER TABLE public.order_payment_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads order payment links" ON public.order_payment_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','agent','user')));
CREATE POLICY "Clients read own order payment links" ON public.order_payment_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.client_id = auth.uid() OR lower(o.contact_email) = lower(coalesce(auth.jwt()->>'email','')))));
CREATE INDEX order_payment_links_order_idx ON public.order_payment_links(order_id);
CREATE TRIGGER order_payment_links_updated_at BEFORE UPDATE ON public.order_payment_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.stripe_payments ADD COLUMN IF NOT EXISTS order_id uuid, ADD COLUMN IF NOT EXISTS payment_link_id uuid, ADD COLUMN IF NOT EXISTS checkout_session_id text;
CREATE UNIQUE INDEX IF NOT EXISTS stripe_payments_checkout_session_key ON public.stripe_payments(checkout_session_id) WHERE checkout_session_id IS NOT NULL;