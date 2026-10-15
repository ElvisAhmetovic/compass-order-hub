CREATE OR REPLACE FUNCTION public.sync_reminder_interval_on_resolved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status_resolved IS DISTINCT FROM OLD.status_resolved THEN
    IF NEW.status_resolved IS TRUE THEN
      UPDATE public.invoices SET reminder_interval_hours = 72,
        next_reminder_at = LEAST(COALESCE(next_reminder_at, now() + interval '72 hours'), now() + interval '72 hours'),
        updated_at = now()
      WHERE order_id = NEW.id AND status IN ('sent','overdue','partially_paid');
    ELSE
      UPDATE public.invoices SET reminder_interval_hours = 168, updated_at = now()
      WHERE order_id = NEW.id AND status IN ('sent','overdue','partially_paid') AND reminder_interval_hours = 72;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS orders_resolved_reminder_interval ON public.orders;
CREATE TRIGGER orders_resolved_reminder_interval AFTER UPDATE OF status_resolved ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_reminder_interval_on_resolved();

UPDATE public.invoices i SET reminder_interval_hours = 72,
  next_reminder_at = LEAST(COALESCE(i.next_reminder_at, now() + interval '72 hours'), now() + interval '72 hours'),
  updated_at = now()
FROM public.orders o
WHERE i.order_id = o.id AND o.status_resolved IS TRUE AND i.status IN ('sent','overdue','partially_paid');