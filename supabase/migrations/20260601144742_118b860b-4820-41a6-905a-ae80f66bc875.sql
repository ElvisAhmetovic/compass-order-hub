UPDATE public.monthly_installments
SET email_sent = false, email_sent_at = NULL
WHERE contract_id IN (
  'c84b7688-114b-469f-aa51-495ec2d0cb58',
  '024c52d5-0a50-4b64-97dc-d40706d96796',
  'f7ab6de0-c9cd-4f31-a341-1853ed0d2a64'
)
AND month_label IN ('Juni 2026','June 2026')
AND invoice_id IS NULL;
