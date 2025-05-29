
import { supabase } from "@/integrations/supabase/client";
import { Invoice, Client, InvoiceLineItem, Payment, InvoiceFormData } from "@/types/invoice";

export class InvoiceService {
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
    let userId = null;
    
    // First try to get user from localStorage (for app users)
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      try {
        const userData = JSON.parse(userSession);
        userId = userData.id;
        console.log('Using localStorage user ID:', userId);
      } catch (error) {
        console.error('Error parsing user session:', error);
      }
    }

    // If no user from localStorage, try Supabase auth as fallback
    if (!userId) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (user && !userError) {
          userId = user.id;
          console.log('Using Supabase auth user ID:', userId);
        }
      } catch (error) {
        console.error('Error getting Supabase user:', error);
      }
    }

    // If still no user, create a temporary user ID
    if (!userId) {
      userId = crypto.randomUUID();
      console.log('Creating client with temporary user ID:', userId);
    }

    if (!userId) {
      throw new Error('User must be authenticated to create clients');
    }

    console.log('Creating client with user_id:', userId);
    console.log('Client data:', clientData);

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating client:', error);
      throw error;
    }
    
    console.log('Successfully created client:', data);
    return data;
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
