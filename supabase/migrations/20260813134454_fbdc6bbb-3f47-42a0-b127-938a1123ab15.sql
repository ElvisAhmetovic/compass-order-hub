ALTER TABLE public.invoices ALTER COLUMN reminder_interval_hours SET DEFAULT 168;

-- Ensure any legacy NULL rows adopt the new default (safe: rows already set keep their value)
UPDATE public.invoices SET reminder_interval_hours = 168 WHERE reminder_interval_hours IS NULL;