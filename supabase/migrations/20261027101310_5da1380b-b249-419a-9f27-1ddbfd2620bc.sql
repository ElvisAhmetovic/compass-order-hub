ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;
CREATE OR REPLACE FUNCTION public.track_invoice_paid_at() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'paid' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid' OR NEW.paid_at IS NULL THEN
      NEW.paid_at := COALESCE(NEW.paid_at, now());
    END IF;
  ELSE
    NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER invoices_track_paid_at BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.track_invoice_paid_at();
UPDATE public.invoices i SET paid_at = COALESCE((SELECT max(p.payment_date)::timestamptz FROM public.payments p WHERE p.invoice_id = i.id), i.updated_at) WHERE i.status = 'paid' AND i.paid_at IS NULL;