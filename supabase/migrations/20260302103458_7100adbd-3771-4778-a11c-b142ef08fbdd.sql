ALTER TABLE public.monthly_installments 
ADD COLUMN invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;