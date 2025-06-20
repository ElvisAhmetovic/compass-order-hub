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
    console.log('🚀 INVOICE CREATION REQUEST STARTED');
    console.log('Request timestamp:', new Date().toISOString());
    console.log('Invoice data received:', invoiceData);
    
    try {
      // Check authentication first
      console.log('Step 1: Authenticating user...');
      const user = await this.getAuthenticatedUser();
      
      if (!user) {
        console.error('🚫 AUTHENTICATION FAILED: No user found');
        throw new Error('Authentication required. Please log in to create invoices.');
      }

      console.log('✅ User authenticated successfully');

      // Generate invoice number
      console.log('Step 2: Generating invoice number...');
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number');

      if (numberError) {
        console.error('🚫 INVOICE NUMBER GENERATION FAILED:', numberError);
        throw numberError;
      }

      console.log('✅ Invoice number generated:', invoiceNumber);

      // Create invoice first
      console.log('Step 3: Creating invoice record...');
      const invoiceInsertData = {
        invoice_number: invoiceNumber,
        client_id: invoiceData.client_id,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        currency: invoiceData.currency,
        payment_terms: invoiceData.payment_terms,
        notes: invoiceData.notes,
        internal_notes: invoiceData.internal_notes,
        user_id: user.id,
      };

      console.log('Invoice insert data:', invoiceInsertData);

      const { data: invoiceResult, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceInsertData)
        .select()
        .single();

      if (invoiceError) {
        console.error('🚫 INVOICE CREATION FAILED:', invoiceError);
        throw invoiceError;
      }

      console.log('✅ Invoice created successfully:', invoiceResult);

      // Add line items using the existing addLineItems method which has proper verification
      if (invoiceData.line_items.length > 0) {
        console.log('Step 4: Adding line items using addLineItems method...');
        console.log('Line items to add:', invoiceData.line_items);
        
        try {
          await this.addLineItems(invoiceResult.id, invoiceData.line_items);
          console.log('✅ Line items added successfully');
        } catch (lineItemError) {
          console.error('🚫 LINE ITEMS CREATION FAILED:', lineItemError);
          // Don't throw here, let the invoice be created without line items
          console.log('⚠️ Proceeding without line items due to error');
        }
      }

      console.log('🎉 INVOICE CREATION COMPLETED SUCCESSFULLY');
      return invoiceResult;

    } catch (error) {
      console.error('💥 INVOICE CREATION REQUEST FAILED');
      console.error('Error details:', error);
      throw error;
    }
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
    console.log('🚀 ADDING LINE ITEMS');
    console.log('Invoice ID:', invoiceId);
    console.log('Line items to add:', lineItems);
    
    try {
      // Get current user for debugging
      const user = await this.getAuthenticatedUser();
      console.log('Current user for line items:', user?.id);

      // Verify the invoice exists and belongs to the current user
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, user_id')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) {
        console.error('🚫 INVOICE VERIFICATION FAILED:', invoiceError);
        throw invoiceError;
      }

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.user_id !== user?.id) {
        throw new Error('You do not have permission to add line items to this invoice');
      }

      console.log('✅ Invoice ownership verified');

      const lineItemsWithInvoiceId = lineItems.map(item => ({
        ...item,
        invoice_id: invoiceId,
      }));

      console.log('Line items with invoice ID:', lineItemsWithInvoiceId);

      const { data, error } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsWithInvoiceId)
        .select();

      if (error) {
        console.error('🚫 LINE ITEMS INSERT ERROR:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }

      console.log('✅ Line items inserted successfully:', data);
    } catch (error) {
      console.error('💥 ADD LINE ITEMS FAILED:', error);
      throw error;
    }
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
