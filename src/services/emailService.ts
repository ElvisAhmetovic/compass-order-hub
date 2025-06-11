
import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'invoice' | 'payment_reminder' | 'order_status' | 'general';
  isDefault?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  template_id?: string;
  order_id?: string;
  invoice_id?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  template_id?: string;
  order_id?: string;
  invoice_id?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export class EmailService {
  // Send email using Supabase Edge Function
  static async sendEmail(emailData: SendEmailRequest): Promise<EmailLog> {
    try {
      console.log('Sending email:', emailData);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('Error sending email:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // Send invoice email
  static async sendInvoiceEmail(invoiceId: string, clientEmail: string, customMessage?: string): Promise<EmailLog> {
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoice_id: invoiceId,
          client_email: clientEmail,
          custom_message: customMessage
        }
      });

      if (error) {
        console.error('Error sending invoice email:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      throw error;
    }
  }

  // Send payment reminder
  static async sendPaymentReminder(invoiceId: string, templateId?: string): Promise<EmailLog> {
    try {
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          invoice_id: invoiceId,
          template_id: templateId
        }
      });

      if (error) {
        console.error('Error sending payment reminder:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to send payment reminder:', error);
      throw error;
    }
  }

  // Send order status notification
  static async sendOrderStatusNotification(orderId: string, status: string, clientEmail: string): Promise<EmailLog> {
    try {
      const { data, error } = await supabase.functions.invoke('send-order-notification', {
        body: {
          order_id: orderId,
          status: status,
          client_email: clientEmail
        }
      });

      if (error) {
        console.error('Error sending order notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to send order notification:', error);
      throw error;
    }
  }

  // Get email templates
  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email templates:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get email templates:', error);
      throw error;
    }
  }

  // Create email template
  static async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        console.error('Error creating email template:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create email template:', error);
      throw error;
    }
  }

  // Get email logs
  static async getEmailLogs(orderId?: string, invoiceId?: string): Promise<EmailLog[]> {
    try {
      let query = supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching email logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get email logs:', error);
      throw error;
    }
  }

  // Track email open
  static async trackEmailOpen(emailId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_logs')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('id', emailId);

      if (error) {
        console.error('Error tracking email open:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to track email open:', error);
      throw error;
    }
  }

  // Track email click
  static async trackEmailClick(emailId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_logs')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('id', emailId);

      if (error) {
        console.error('Error tracking email click:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to track email click:', error);
      throw error;
    }
  }
}
