-- Extend proposals table with additional columns for complete proposal data
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 19,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_country TEXT,
ADD COLUMN IF NOT EXISTS customer_ref TEXT,
ADD COLUMN IF NOT EXISTS your_contact TEXT,
ADD COLUMN IF NOT EXISTS internal_contact TEXT,
ADD COLUMN IF NOT EXISTS proposal_title TEXT,
ADD COLUMN IF NOT EXISTS proposal_description TEXT,
ADD COLUMN IF NOT EXISTS delivery_terms TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
ADD COLUMN IF NOT EXISTS footer_content TEXT,
ADD COLUMN IF NOT EXISTS include_payment_data BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 33,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pdf_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS proposal_date TEXT,
ADD COLUMN IF NOT EXISTS proposal_time TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bic TEXT,
ADD COLUMN IF NOT EXISTS blz_konto TEXT,
ADD COLUMN IF NOT EXISTS content TEXT;

-- Create proposal_line_items table
CREATE TABLE IF NOT EXISTS proposal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'unit',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on proposal_line_items
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policy for proposal_line_items - users can manage line items for their own proposals
CREATE POLICY "Users can manage their proposal line items"
  ON proposal_line_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM proposals 
    WHERE proposals.id = proposal_line_items.proposal_id 
    AND proposals.user_id = auth.uid()
  ));

-- Admin policy for proposal_line_items
CREATE POLICY "Admins can manage all proposal line items"
  ON proposal_line_items FOR ALL
  USING (is_admin());