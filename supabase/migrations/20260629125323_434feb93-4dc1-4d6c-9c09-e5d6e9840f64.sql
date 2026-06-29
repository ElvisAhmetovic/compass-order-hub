CREATE OR REPLACE FUNCTION public.trigger_review_request_on_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := 'https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/send-review-request';
BEGIN
  IF NEW.status_resolved IS TRUE
     AND NEW.status_invoice_paid IS TRUE
     AND NEW.review_request_sent_at IS NULL
     AND (
       OLD.status_resolved IS DISTINCT FROM NEW.status_resolved
       OR OLD.status_invoice_paid IS DISTINCT FROM NEW.status_invoice_paid
     )
  THEN
    BEGIN
      PERFORM net.http_post(
        url := v_url,
        body := jsonb_build_object('orderId', NEW.id::text),
        headers := '{"Content-Type":"application/json"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'send-review-request enqueue failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;