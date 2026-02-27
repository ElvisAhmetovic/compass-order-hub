ALTER TABLE public.client_email_logs ADD COLUMN email_subject TEXT;
ALTER TABLE public.client_email_logs ADD COLUMN template_name TEXT;
ALTER TABLE public.client_email_logs ADD COLUMN invoice_number TEXT;