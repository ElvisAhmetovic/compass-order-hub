import { supabase } from '@/integrations/supabase/client';

export interface CustomerTicket {
  id: string;
  order_id: string;
  client_email: string;
  client_name: string | null;
  company_name: string | null;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  notes: string | null;
}

export const customerTicketService = {
  async getAll(): Promise<CustomerTicket[]> {
    const { data, error } = await supabase
      .from('customer_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as CustomerTicket[];
  },

  async getById(id: string): Promise<CustomerTicket | null> {
    const { data, error } = await supabase
      .from('customer_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as CustomerTicket;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('customer_tickets')
      .update({ status } as any)
      .eq('id', id);

    if (error) throw error;
  },

  async updateNotes(id: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('customer_tickets')
      .update({ notes } as any)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteTicket(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getOpenCount(): Promise<number> {
    const { count, error } = await supabase
      .from('customer_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (error) return 0;
    return count ?? 0;
  },
};
