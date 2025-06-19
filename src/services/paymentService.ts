
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
  gateway_session_id?: string;
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

// Store payment links in memory to persist across operations
const mockPaymentLinks: { [invoiceId: string]: PaymentLink[] } = {};

export class PaymentService {
  // Create payment link with enhanced gateway support
  static async createPaymentLink(invoiceId: string, paymentMethod: string = 'stripe'): Promise<PaymentLink> {
    try {
      console.log('Creating payment link for invoice:', invoiceId, 'using method:', paymentMethod);

      // For demonstration, we'll create a mock payment link
      // In production, you'd integrate with real payment gateways
      const mockPaymentLink: PaymentLink = {
        id: `pl_${Date.now()}`,
        invoice_id: invoiceId,
        payment_url: this.generateMockPaymentUrl(paymentMethod),
        amount: 0, // This would come from the invoice
        currency: 'EUR',
        status: 'active',
        payment_method: paymentMethod as any,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString(),
        gateway_session_id: `sess_${Date.now()}`
      };

      // In production, you'd call the actual payment gateway APIs here
      switch (paymentMethod) {
        case 'stripe':
          // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          // const session = await stripe.checkout.sessions.create({...});
          break;
        case 'paypal':
          // PayPal API integration
          break;
        case 'bank_transfer':
          // Generate bank transfer instructions
          mockPaymentLink.payment_url = '/bank-transfer-instructions';
          break;
      }

      // Store in memory
      if (!mockPaymentLinks[invoiceId]) {
        mockPaymentLinks[invoiceId] = [];
      }
      mockPaymentLinks[invoiceId].push(mockPaymentLink);
      
      console.log('Mock payment link created:', mockPaymentLink);
      
      return mockPaymentLink;
    } catch (error) {
      console.error('Failed to create payment link:', error);
      throw error;
    }
  }

  private static generateMockPaymentUrl(method: string): string {
    const baseUrls = {
      stripe: 'https://checkout.stripe.com/pay/',
      paypal: 'https://www.paypal.com/checkoutnow/',
      bank_transfer: '/bank-transfer'
    };
    
    return `${baseUrls[method] || baseUrls.stripe}${Date.now()}`;
  }

  // Get payment links for invoice
  static async getPaymentLinks(invoiceId: string): Promise<PaymentLink[]> {
    try {
      // Return stored payment links for this invoice, or create default ones if none exist
      if (mockPaymentLinks[invoiceId]) {
        return mockPaymentLinks[invoiceId];
      }

      // Initialize with default mock data only if no links exist yet
      const mockLinks: PaymentLink[] = [
        {
          id: 'pl_1',
          invoice_id: invoiceId,
          payment_url: 'https://checkout.stripe.com/pay/mock',
          amount: 99.99,
          currency: 'EUR',
          status: 'active',
          payment_method: 'stripe',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ];

      // Store the initial mock data
      mockPaymentLinks[invoiceId] = mockLinks;
      return mockLinks;
    } catch (error) {
      console.error('Failed to get payment links:', error);
      throw error;
    }
  }

  // Enhanced method to process different payment types
  static async processPayment(paymentData: {
    amount: number;
    currency: string;
    method: string;
    invoice_id: string;
  }): Promise<any> {
    try {
      console.log('Processing payment:', paymentData);

      switch (paymentData.method) {
        case 'stripe':
          return await this.processStripePayment(paymentData);
        case 'paypal':
          return await this.processPayPalPayment(paymentData);
        case 'bank_transfer':
          return await this.processBankTransfer(paymentData);
        default:
          throw new Error(`Unsupported payment method: ${paymentData.method}`);
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    }
  }

  private static async processStripePayment(paymentData: any) {
    // Stripe payment processing logic
    console.log('Processing Stripe payment:', paymentData);
    // In production: integrate with Stripe API
    return { success: true, method: 'stripe' };
  }

  private static async processPayPalPayment(paymentData: any) {
    // PayPal payment processing logic
    console.log('Processing PayPal payment:', paymentData);
    // In production: integrate with PayPal API
    return { success: true, method: 'paypal' };
  }

  private static async processBankTransfer(paymentData: any) {
    // Bank transfer processing logic
    console.log('Processing bank transfer:', paymentData);
    return { success: true, method: 'bank_transfer' };
  }

  // Get available payment methods with enhanced configuration
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      // Mock data - in production, this would come from your configuration
      const methods: PaymentMethod[] = [
        {
          id: 'stripe',
          name: 'Stripe',
          type: 'stripe',
          enabled: true,
          config: {
            public_key: 'pk_test_...',
            supports_currencies: ['EUR', 'USD', 'GBP'],
            fee_percentage: 2.9,
            fee_fixed: 0.30
          }
        },
        {
          id: 'paypal',
          name: 'PayPal',
          type: 'paypal',
          enabled: true,
          config: {
            client_id: 'paypal_client_id',
            supports_currencies: ['EUR', 'USD', 'GBP'],
            fee_percentage: 3.4,
            fee_fixed: 0.30
          }
        },
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          type: 'bank_transfer',
          enabled: true,
          config: {
            account_details: {
              iban: 'DE89 3704 0044 0532 0130 00',
              bic: 'COBADEFFXXX',
              bank_name: 'Commerzbank'
            },
            fee_percentage: 0,
            fee_fixed: 0
          }
        }
      ];

      return methods;
    } catch (error) {
      console.error('Failed to get payment methods:', error);
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
      // Mock implementation - replace with actual database query
      const mockPaymentLink: PaymentLink = {
        id: paymentLinkId,
        invoice_id: 'inv_123',
        payment_url: 'https://checkout.stripe.com/pay/mock',
        amount: 99.99,
        currency: 'EUR',
        status: 'active',
        payment_method: 'stripe',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      return mockPaymentLink;
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  // Update payment link status
  static async updatePaymentLinkStatus(paymentLinkId: string, status: string, transactionId?: string): Promise<void> {
    try {
      console.log('Updating payment link status:', { paymentLinkId, status, transactionId });
      // In production: update database record
    } catch (error) {
      console.error('Failed to update payment link status:', error);
      throw error;
    }
  }

  // Cancel payment link
  static async cancelPaymentLink(paymentLinkId: string): Promise<void> {
    try {
      console.log('Cancelling payment link:', paymentLinkId);
      // In production: update database and cancel with payment provider
    } catch (error) {
      console.error('Failed to cancel payment link:', error);
      throw error;
    }
  }

  // Refresh payment status from provider
  static async refreshPaymentStatus(paymentLinkId: string): Promise<PaymentLink> {
    try {
      // In production: check status with payment provider and update database
      return await this.getPaymentStatus(paymentLinkId);
    } catch (error) {
      console.error('Failed to refresh payment status:', error);
      throw error;
    }
  }

  // Delete payment link
  static async deletePaymentLink(linkId: string): Promise<void> {
    try {
      console.log(`Deleting payment link: ${linkId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from our in-memory storage
      for (const invoiceId in mockPaymentLinks) {
        mockPaymentLinks[invoiceId] = mockPaymentLinks[invoiceId].filter(link => link.id !== linkId);
      }
      
      // In production, this would be:
      // const response = await fetch(`/api/payment-links/${linkId}`, { method: 'DELETE' });
      // if (!response.ok) throw new Error('Failed to delete payment link');
      
      return;
    } catch (error) {
      console.error('Failed to delete payment link:', error);
      throw new Error('Unable to delete payment link at this time');
    }
  }
}
