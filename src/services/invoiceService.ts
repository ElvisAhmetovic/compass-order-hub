
import { supabase } from "@/integrations/supabase/client";
import { Invoice, Client, InvoiceLineItem, Payment, InvoiceFormData } from "@/types/invoice";

export class InvoiceService {
  // Helper method to get authenticated user with extensive logging
  private static async getAuthenticatedUser() {
    console.log('=== AUTHENTICATION DEBUG START ===');
    
    try {
      // Check Supabase auth first
      console.log('Checking Supabase auth...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Supabase auth error:', userError);
        return null;
      }
      
      if (user) {
        console.log('✅ Supabase user found:', {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'user'
        });
        console.log('=== AUTHENTICATION DEBUG END ===');
        return user;
      }

      console.log('❌ No authenticated user found in Supabase');
      console.log('=== AUTHENTICATION DEBUG END ===');
      return null;
    } catch (error) {
      console.error('❌ Critical error in getAuthenticatedUser:', error);
      console.log('=== AUTHENTICATION DEBUG END ===');
      return null;
    }
  }

  // Helper method to check user permissions with detailed logging
  private static checkUserPermissions(user: any, action: string): boolean {
    console.log('=== PERMISSION CHECK DEBUG START ===');
    console.log('Checking permissions for action:', action);
    console.log('User object received:', user);
    
    if (!user) {
      console.error('❌ Permission check failed: No user provided');
      console.log('=== PERMISSION CHECK DEBUG END ===');
      return false;
    }

    console.log('User role detected:', user.user_metadata?.role || 'user');
    console.log('Action requested:', action);
    
    // Admin users can perform all actions
    if (user.user_metadata?.role === 'admin') {
      console.log('✅ Permission granted: User is admin');
      console.log('=== PERMISSION CHECK DEBUG END ===');
      return true;
    }

    // For client creation, allow users, agents, and admins
    if (action === 'create_client') {
      const allowedRoles = ['user', 'agent', 'admin'];
      const userRole = user.user_metadata?.role || 'user';
      const hasPermission = allowedRoles.includes(userRole);
      
      console.log('Allowed roles for create_client:', allowedRoles);
      console.log('User role:', userRole);
      console.log('Permission result:', hasPermission ? '✅ GRANTED' : '❌ DENIED');
      console.log('=== PERMISSION CHECK DEBUG END ===');
      
      return hasPermission;
    }

    // Default to allowing the action for authenticated users
    console.log('✅ Permission granted: Default allow for authenticated users');
    console.log('=== PERMISSION CHECK DEBUG END ===');
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
    console.log('🚀 CLIENT CREATION REQUEST STARTED');
    console.log('Request timestamp:', new Date().toISOString());
    console.log('Client data received:', {
      name: clientData.name,
      email: clientData.email,
      contact_person: clientData.contact_person
    });
    
    try {
      // Step 1: Authenticate user
      console.log('Step 1: Authenticating user...');
      const user = await this.getAuthenticatedUser();
      
      if (!user) {
        console.error('🚫 AUTHENTICATION FAILED: No user found');
        throw new Error('Authentication required. Please log in to create clients.');
      }

      console.log('✅ User authenticated successfully');
      console.log('Authenticated user details:', {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user'
      });

      // Step 2: Check authorization
      console.log('Step 2: Checking user authorization...');
      const hasPermission = this.checkUserPermissions(user, 'create_client');
      
      if (!hasPermission) {
        console.error('🚫 AUTHORIZATION FAILED: User does not have permission to create clients');
        console.error('User role:', user.user_metadata?.role || 'user');
        throw new Error('You do not have permission to create clients. Please contact your administrator.');
      }

      console.log('✅ User authorized to create clients');

      // Step 3: Validate required fields
      console.log('Step 3: Validating required fields...');
      if (!clientData.name || !clientData.email) {
        console.error('🚫 VALIDATION FAILED: Missing required fields');
        throw new Error('Name and email are required fields.');
      }

      console.log('✅ Required fields validated');

      // Step 4: Prepare data for insertion
      const insertData = {
        ...clientData,
        user_id: user.id
      };

      console.log('Step 4: Preparing data for Supabase insertion...');
      console.log('Insert data:', {
        name: insertData.name,
        email: insertData.email,
        user_id: insertData.user_id,
        contact_person: insertData.contact_person
      });

      // Step 5: Insert into Supabase
      console.log('Step 5: Inserting client into Supabase...');
      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('🚫 SUPABASE ERROR:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        
        // Provide specific error messages based on error codes
        if (error.code === '23505') {
          throw new Error('A client with this email already exists.');
        } else if (error.code === '23503') {
          throw new Error('Invalid user reference. Please try logging out and logging back in.');
        } else if (error.code === '42501') {
          throw new Error('Permission denied. You do not have access to create clients.');
        } else {
          throw new Error(`Failed to create client: ${error.message}`);
        }
      }
      
      console.log('✅ CLIENT CREATION SUCCESSFUL');
      console.log('Created client:', {
        id: data.id,
        name: data.name,
        email: data.email
      });
      console.log('🎉 CLIENT CREATION REQUEST COMPLETED SUCCESSFULLY');
      
      return data;

    } catch (error) {
      console.error('💥 CLIENT CREATION REQUEST FAILED');
      console.error('Error details:', error);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        throw error;
      } else {
        console.error('Unknown error type:', typeof error);
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
