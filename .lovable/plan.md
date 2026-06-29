## Problem

Toggling "Invoice Paid" fails with:
```
function extensions.http_post(url => text, body => jsonb, headers => jsonb) does not exist
```

This comes from the `trigger_review_request_on_order_update` trigger I added last turn. It calls `extensions.http_post(...)`, but `pg_net` exposes the function as `net.http_post(...)` (in the `net` schema), not `extensions.http_post`. Because the trigger errors out, the entire `UPDATE orders` transaction is rolled back — so the status toggle itself fails.

## Fix

Replace the trigger function so it calls the correct `pg_net` function and never blocks the order update even if the HTTP call fails.

### Migration

```sql
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
      -- Never block the order update if the HTTP enqueue fails
      RAISE WARNING 'send-review-request enqueue failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;
```

The client-side fire-and-forget invoke in `orderService.ts` stays as the primary path; this trigger is just the server-side fallback, now wrapped so any failure logs a warning instead of aborting the transaction.

## Validation

After the migration, toggling "Invoice Paid" on any order should succeed without the 42883 error, and a Resolved + Invoice Paid order should still trigger the review email.
