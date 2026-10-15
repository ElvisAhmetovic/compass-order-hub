ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cancelled_at timestamptz, ADD COLUMN IF NOT EXISTS cancelled_by uuid;
CREATE OR REPLACE FUNCTION public.track_invoice_cancellation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    NEW.cancelled_at := now(); NEW.cancelled_by := auth.uid();
  ELSIF NEW.status <> 'cancelled' AND OLD.status = 'cancelled' THEN
    NEW.cancelled_at := NULL; NEW.cancelled_by := NULL;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER invoices_track_cancellation BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.track_invoice_cancellation();