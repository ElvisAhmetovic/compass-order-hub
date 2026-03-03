import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types/invoice';

export interface InvoiceSearchResult {
  invoice: Invoice;
  clientName: string;
  clientEmail: string;
}

export class InvoiceSearchService {
  /**
   * Search invoices by invoice number, client name, or client email
   */
  static async searchInvoices(query: string): Promise<InvoiceSearchResult[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*)
        `)
        .or(`invoice_number.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error searching invoices:', error);
        return [];
      }

      // Also search by client name/email if no direct invoice_number match
      const { data: clientMatches, error: clientError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients!inner(*)
        `)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`, { referencedTable: 'clients' })
        .order('created_at', { ascending: false })
        .limit(50);

      if (clientError) {
        console.error('Error searching invoices by client:', clientError);
      }

      // Merge and deduplicate results
      const allResults = [...(data || []), ...(clientMatches || [])];
      const uniqueMap = new Map<string, any>();
      allResults.forEach(inv => uniqueMap.set(inv.id, inv));

      return Array.from(uniqueMap.values()).map(inv => ({
        invoice: inv,
        clientName: inv.client?.name || 'Unknown',
        clientEmail: inv.client?.email || '',
      }));
    } catch (error) {
      console.error('Error in invoice search:', error);
      return [];
    }
  }

  /**
   * Get client emails that have invoices matching the query.
   * Used to cross-reference with orders in dashboard search.
   */
  static async getMatchingClientEmails(query: string): Promise<string[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          client:clients(email, name)
        `)
        .ilike('invoice_number', searchTerm);

      if (error) {
        console.error('Error getting matching client emails:', error);
        return [];
      }

      const emails: string[] = [];
      (data || []).forEach((inv: any) => {
        if (inv.client?.email) emails.push(inv.client.email.toLowerCase());
      });

      return [...new Set(emails)];
    } catch (error) {
      console.error('Error in getMatchingClientEmails:', error);
      return [];
    }
  }

  /**
   * Get all invoices for a specific client
   */
  static async getInvoicesForClient(clientId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, client:clients(*)`)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting invoices for client:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInvoicesForClient:', error);
      return [];
    }
  }
}
