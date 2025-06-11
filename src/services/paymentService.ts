
import { supabase } from "@/integrations/supabase/client";

export interface PaymentLink {
  id: string;
  invoice_id: string;
  payment_url: string;
  amount: number;
  currency: string;
  status: 'active' | 'paid' | 'expired' | 'cancelled';
  payment_method: 'stripe' | 'paypal' | 'bank_transfer' | 'other';
  expires_at: string;
  created_at: string;
  paid_at?: string;
  transaction_id?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'bank_transfer' | 'other';
  config: Record<string, any>;
  enabled: boolean;
}

export interface PaymentWebhookEvent {
  id: string;
  payment_link_id: string;
  event_type: 'payment.success' | 'payment.failed' | 'payment.pending';
  data: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export class PaymentService {
  // Create payment link
  static async createPaymentLink(invoiceId: string, paymentMethod: string = 'stripe'): Promise<PaymentLink> {
    try {
      console.log('Creating payment link for invoice:', invoiceId);

      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          invoice_id: invoiceId,
          payment_method: paymentMethod
        }
      });

      if (error) {
        console.error('Error creating payment link:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create payment link:', error);
      throw error;
    }
  }

  // Get payment links for invoice
  static async getPaymentLinks(invoiceId: string): Promise<PaymentLink[]> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment links:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get payment links:', error);
      throw error;
    }
  }

  // Process payment webhook
  static async processPaymentWebhook(webhookData: any): Promise<void> {
    try {
      console.log('Processing payment webhook:', webhookData);

      const { data, error } = await supabase.functions.invoke('process-payment-webhook', {
        body: webhookData
      });

      if (error) {
        console.error('Error processing payment webhook:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to process payment webhook:', error);
      throw error;
    }
  }

  // Get payment status
  static async getPaymentStatus(paymentLinkId: string): Promise<PaymentLink> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', paymentLinkId)
        .single();

      if (error) {
        console.error('Error fetching payment status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  // Get available payment methods
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('enabled', true)
        .order('name');

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      throw error;
    }
  }

  // Update payment link status
  static async updatePaymentLinkStatus(paymentLinkId: string, status: string, transactionId?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      const { error } = await supabase
        .from('payment_links')
        .update(updateData)
        .eq('id', paymentLinkId);

      if (error) {
        console.error('Error updating payment link status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update payment link status:', error);
      throw error;
    }
  }

  // Cancel payment link
  static async cancelPaymentLink(paymentLinkId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_links')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentLinkId);

      if (error) {
        console.error('Error cancelling payment link:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to cancel payment link:', error);
      throw error;
    }
  }

  // Refresh payment status from provider
  static async refreshPaymentStatus(paymentLinkId: string): Promise<PaymentLink> {
    try {
      const { data, error } = await supabase.functions.invoke('refresh-payment-status', {
        body: { payment_link_id: paymentLinkId }
      });

      if (error) {
        console.error('Error refreshing payment status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to refresh payment status:', error);
      throw error;
    }
  }
}
