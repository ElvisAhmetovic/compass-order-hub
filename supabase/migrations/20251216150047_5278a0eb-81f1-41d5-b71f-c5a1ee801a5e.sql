-- Create email_templates table for storing customizable email templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'payment_reminder',
  is_default BOOLEAN DEFAULT false,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_email_templates_type ON public.email_templates(type);
CREATE INDEX idx_email_templates_user_id ON public.email_templates(user_id);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view templates
CREATE POLICY "Authenticated users can view email templates" ON public.email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can create templates
CREATE POLICY "Authenticated users can create email templates" ON public.email_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own templates or admins can update any
CREATE POLICY "Users can update own templates or admins any" ON public.email_templates
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- Users can delete their own templates or admins can delete any
CREATE POLICY "Users can delete own templates or admins any" ON public.email_templates
  FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Insert default templates
INSERT INTO public.email_templates (name, subject, body, type, is_default) VALUES
(
  'Friendly Reminder',
  '💰 Payment Reminder - {companyName} - {amount}',
  '<p>Dear <strong>{companyName}</strong>,</p>

<p>We hope this message finds you well. This is a friendly reminder regarding your outstanding payment for the services we provided.</p>

<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
  <h3 style="margin: 0 0 15px 0;">Order Details</h3>
  <p><strong>Company:</strong> {companyName}</p>
  <p><strong>Order Date:</strong> {orderDate}</p>
  <p><strong>Amount Due:</strong> <span style="font-size: 18px; color: #d32f2f; font-weight: bold;">{amount}</span></p>
</div>

{customMessage}

<p>We kindly request that you complete your payment at your earliest convenience. If you have any questions, please don''t hesitate to reach out.</p>

<p>Thank you for your business!</p>

<p>Best regards,<br><strong>AB Media Team</strong></p>',
  'payment_reminder',
  true
),
(
  'Professional Notice',
  'Payment Due Notice - {companyName} - {amount}',
  '<p>Dear {companyName},</p>

<p>This letter serves as a formal notice regarding the outstanding balance on your account.</p>

<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin: 0 0 15px 0;">Account Summary</h3>
  <p><strong>Client:</strong> {companyName}</p>
  <p><strong>Invoice Date:</strong> {orderDate}</p>
  <p><strong>Outstanding Amount:</strong> <strong style="font-size: 18px;">{amount}</strong></p>
</div>

{customMessage}

<p>Please remit payment promptly to avoid any interruption to your services. Should you have questions regarding this notice or need to discuss payment arrangements, please contact our accounts department.</p>

<p>Sincerely,<br><strong>AB Media Team</strong></p>',
  'payment_reminder',
  false
),
(
  'Urgent Payment Due',
  '⚠️ URGENT: Payment Overdue - {companyName} - {amount}',
  '<p>Dear {companyName},</p>

<p><strong style="color: #d32f2f;">Your payment is now overdue.</strong></p>

<p>Despite our previous reminders, we have not yet received payment for the following:</p>

<div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
  <h3 style="margin: 0 0 15px 0; color: #c62828;">Overdue Payment Details</h3>
  <p><strong>Company:</strong> {companyName}</p>
  <p><strong>Original Date:</strong> {orderDate}</p>
  <p><strong>Amount Overdue:</strong> <span style="font-size: 20px; color: #d32f2f; font-weight: bold;">{amount}</span></p>
</div>

{customMessage}

<p><strong>Please arrange payment immediately</strong> to avoid further action. If you are experiencing difficulties, please contact us right away to discuss possible arrangements.</p>

<p>Regards,<br><strong>AB Media Team</strong></p>',
  'payment_reminder',
  false
),
(
  'Final Notice',
  '🚨 FINAL NOTICE: Immediate Payment Required - {companyName}',
  '<p>Dear {companyName},</p>

<p style="color: #d32f2f; font-weight: bold; font-size: 16px;">THIS IS YOUR FINAL NOTICE BEFORE FURTHER ACTION</p>

<p>We have made multiple attempts to collect the outstanding payment from your account. As of today, the following amount remains unpaid:</p>

<div style="background: #d32f2f; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin: 0 0 15px 0; color: white;">FINAL NOTICE</h3>
  <p style="color: white;"><strong>Company:</strong> {companyName}</p>
  <p style="color: white;"><strong>Amount Due:</strong> <span style="font-size: 24px; font-weight: bold;">{amount}</span></p>
</div>

{customMessage}

<p><strong>Failure to pay within 48 hours</strong> may result in:</p>
<ul>
  <li>Suspension of services</li>
  <li>Collection proceedings</li>
  <li>Additional fees and interest</li>
</ul>

<p>Contact us immediately if you wish to resolve this matter.</p>

<p>AB Media Team</p>',
  'payment_reminder',
  false
);