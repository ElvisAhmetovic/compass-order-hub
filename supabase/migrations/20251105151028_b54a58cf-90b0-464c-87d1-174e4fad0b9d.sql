-- Create notification_settings table
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  recipient_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
  notify_on_status_created boolean NOT NULL DEFAULT true,
  notify_on_status_in_progress boolean NOT NULL DEFAULT true,
  notify_on_status_invoice_sent boolean NOT NULL DEFAULT true,
  notify_on_status_invoice_paid boolean NOT NULL DEFAULT true,
  notify_on_status_complaint boolean NOT NULL DEFAULT true,
  notify_on_status_resolved boolean NOT NULL DEFAULT true,
  notify_on_status_cancelled boolean NOT NULL DEFAULT true,
  notify_on_status_deleted boolean NOT NULL DEFAULT false,
  notify_on_status_review boolean NOT NULL DEFAULT true,
  notify_on_status_facebook boolean NOT NULL DEFAULT false,
  notify_on_status_instagram boolean NOT NULL DEFAULT false,
  notify_on_status_trustpilot boolean NOT NULL DEFAULT false,
  notify_on_status_trustpilot_deletion boolean NOT NULL DEFAULT false,
  notify_on_status_google_deletion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default settings with team email list
INSERT INTO notification_settings (recipient_emails) 
VALUES (ARRAY[
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'kleinabmedia@gmail.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com',
  'ajosesales36@gmail.com',
  'georgabmediateam@gmail.com',
  'jannes@scoolfinanceedu.com'
]);

-- RLS policies for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification settings" 
ON notification_settings FOR ALL 
USING (is_admin());

CREATE POLICY "Authenticated users can view notification settings" 
ON notification_settings FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create notification_logs table
CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status_change text NOT NULL,
  old_status text,
  new_status text,
  changed_by_id uuid REFERENCES auth.users(id),
  changed_by_name text NOT NULL,
  recipient_emails text[] NOT NULL,
  email_subject text NOT NULL,
  email_sent boolean NOT NULL DEFAULT false,
  email_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_notification_logs_order_id ON notification_logs(order_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- RLS policies for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification logs" 
ON notification_logs FOR SELECT 
USING (is_admin());

-- Trigger to update updated_at on notification_settings
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();