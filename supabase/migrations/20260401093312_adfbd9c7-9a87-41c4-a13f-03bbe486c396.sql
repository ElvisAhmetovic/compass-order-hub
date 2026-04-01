UPDATE public.invoices
SET next_reminder_at = NOW() + INTERVAL '48 hours'
WHERE status = 'sent'
  AND next_reminder_at IS NULL
  AND order_id IS NULL
  AND reminders_paused = false;