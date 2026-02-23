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
  assigned_client_id: string | null;
  assigned_client_name: string | null;
  assigned_client_email: string | null;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
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

  async getClientUsers(): Promise<ClientUser[]> {
    // Get client users by querying app_users with role 'client' or profiles with role 'client'
    const { data, error } = await supabase
      .from('app_users')
      .select('id, full_name, email')
      .eq('role', 'client');

    if (error) {
      console.error('Error fetching client users from app_users:', error);
      // Fallback: try profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('role', 'client');

      if (profileError) throw profileError;
      return (profiles || []).map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim() || 'Unknown',
        email: '',
      }));
    }

    return (data || []).map(u => ({
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
    }));
  },

  async assignToClient(ticketId: string, params: {
    clientId: string;
    clientName: string;
    clientEmail: string;
    orderId: string;
    subject: string;
  }): Promise<void> {
    const { data, error } = await supabase.functions.invoke('assign-customer-ticket', {
      body: {
        ticketId,
        clientId: params.clientId,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        orderId: params.orderId,
        subject: params.subject,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  async unassignClient(ticketId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_tickets')
      .update({
        assigned_client_id: null,
        assigned_client_name: null,
        assigned_client_email: null,
      } as any)
      .eq('id', ticketId);

    if (error) throw error;
  },
};
