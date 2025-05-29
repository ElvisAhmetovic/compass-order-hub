import { supabase } from "@/integrations/supabase/client";
import { Invoice, Client, InvoiceLineItem, Payment, InvoiceFormData } from "@/types/invoice";

export class InvoiceService {
  // Helper method to get authenticated user
  private static async getAuthenticatedUser() {
    try {
      // First try to get user from localStorage (for app users)
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        try {
          const userData = JSON.parse(userSession);
          if (userData.id) {
            console.log('Using localStorage user ID:', userData.id);
            return userData;
          }
        } catch (error) {
          console.error('Error parsing user session:', error);
        }
      }

      // If no user from localStorage, try Supabase auth as fallback
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && !userError) {
        console.log('Using Supabase auth user ID:', user.id);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      return null;
    }
  }

  // Helper method to check user permissions
  private static checkUserPermissions(user: any, action: string): boolean {
    if (!user) {
      console.error('No user provided for permission check');
      return false;
    }

    console.log(`Checking permissions for user role: ${user.role}, action: ${action}`);
    
    // Admin users can perform all actions
    if (user.role === 'admin') {
      return true;
    }

    // For client creation, allow users and agents
    if (action === 'create_client') {
      return ['user', 'agent', 'admin'].includes(user.role);
    }

    // Default to allowing the action for authenticated users
    return true;
  }

  // Invoice operations
  static async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createInvoice(invoiceData: InvoiceFormData): Promise<Invoice> {
    // Check authentication first
    const user = await this.getAuthenticatedUser();
    if (!user) {
      throw new Error('Authentication required to create invoices');
    }

    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');

    if (numberError) throw numberError;

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: invoiceData.client_id,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        currency: invoiceData.currency,
        payment_terms: invoiceData.payment_terms,
        notes: invoiceData.notes,
        internal_notes: invoiceData.internal_notes,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add line items
    if (invoiceData.line_items.length > 0) {
      await this.addLineItems(data.id, invoiceData.line_items);
    }

    return data;
  }

  static async updateInvoice(id: string, invoiceData: Partial<InvoiceFormData> | { status: Invoice['status'] }): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Line items operations
  static async getLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
    const { data, error } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  static async addLineItems(invoiceId: string, lineItems: Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at' | 'updated_at' | 'line_total'>[]): Promise<void> {
    const { error } = await supabase
      .from('invoice_line_items')
      .insert(
        lineItems.map(item => ({
          ...item,
          invoice_id: invoiceId,
        }))
      );

    if (error) throw error;
  }

  static async updateLineItem(id: string, lineItem: Partial<InvoiceLineItem>): Promise<void> {
    const { error } = await supabase
      .from('invoice_line_items')
      .update(lineItem)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteLineItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_line_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Client operations
  static async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async getClient(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    console.log('Creating client - checking authentication...');
    
    // Get authenticated user
    const user = await this.getAuthenticatedUser();
    if (!user) {
      console.error('Authentication failed - no user found');
      throw new Error('Authentication required. Please log in to create clients.');
    }

    console.log('User authenticated:', { id: user.id, role: user.role });

    // Check user permissions
    if (!this.checkUserPermissions(user, 'create_client')) {
      console.error('Permission denied for user:', user.role);
      throw new Error('You do not have permission to create clients. Please contact your administrator.');
    }

    console.log('User authorized to create client');

    console.log('Creating client with data:', clientData);
    console.log('User ID for client:', user.id);

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating client:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error('A client with this email already exists.');
        } else if (error.code === '23503') {
          throw new Error('Invalid user reference. Please try logging out and logging back in.');
        } else {
          throw new Error(`Failed to create client: ${error.message}`);
        }
      }
      
      console.log('Successfully created client:', data);
      return data;
    } catch (error) {
      console.error('Error in createClient:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred while creating the client.');
      }
    }
  }

  static async updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Payment operations
  static async getPayments(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addPayment(paymentData: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Convert proposal to invoice
  static async convertProposalToInvoice(proposalId: string, clientId: string): Promise<Invoice> {
    // Check authentication first
    const user = await this.getAuthenticatedUser();
    if (!user) {
      throw new Error('Authentication required to convert proposals');
    }

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (!proposal) throw new Error('Proposal not found');

    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');

    if (numberError) throw numberError;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: clientId,
        proposal_id: proposalId,
        due_date: dueDate.toISOString(),
        currency: 'EUR',
        payment_terms: 'Net 30',
        notes: `Generated from proposal ${proposal.number}`,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add a basic line item from proposal
    await this.addLineItems(data.id, [{
      item_description: proposal.subject || 'Service',
      quantity: 1,
      unit: 'pcs',
      unit_price: parseFloat(proposal.amount),
      vat_rate: 0.19,
      discount_rate: 0,
    }]);

    return data;
  }
}
