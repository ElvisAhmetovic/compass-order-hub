
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  client_address text,
  company_name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  sent_by uuid,
  sent_by_name text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-client authenticated users can view offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (NOT is_client());

CREATE POLICY "Non-client authenticated users can insert offers"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (NOT is_client());
