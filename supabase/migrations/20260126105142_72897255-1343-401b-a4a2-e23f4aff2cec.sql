-- Create proposal_templates table for storing reusable proposal templates
CREATE TABLE public.proposal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  template_data JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own proposal templates"
  ON public.proposal_templates FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own proposal templates"
  ON public.proposal_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposal templates"
  ON public.proposal_templates FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete their own proposal templates"
  ON public.proposal_templates FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- Create company_settings table for storing company info
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  logo TEXT,
  name TEXT NOT NULL,
  contact_person TEXT,
  street TEXT,
  postal TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  registration_number TEXT,
  vat_id TEXT,
  tax_number TEXT,
  director TEXT,
  wise BOOLEAN DEFAULT false,
  account_number TEXT,
  account_holder TEXT,
  payment_method TEXT,
  bank_code TEXT,
  iban TEXT,
  bic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - users can manage their own, admins can view all
CREATE POLICY "Users can view their own company settings"
  ON public.company_settings FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own company settings"
  ON public.company_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings"
  ON public.company_settings FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_proposal_templates_updated_at
  BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();