import { supabase } from "@/integrations/supabase/client";

export interface PaymentReminderLog {
  id: string;
  reminder_id: string | null;
  order_id: string;
  action: 'created' | 'updated' | 'cancelled' | 'sent';
  actor_id: string | null;
  actor_name: string;
  details: Record<string, any> | null;
  company_name: string | null;
  created_at: string;
}

export interface LogFilters {
  action?: 'created' | 'updated' | 'cancelled' | 'sent';
  actorName?: string;
  companySearch?: string;
}

export type SortOption = 'newest' | 'oldest' | 'company_asc' | 'company_desc';

export const PaymentReminderLogService = {
  async logAction(params: {
    reminderId: string | null;
    orderId: string;
    action: 'created' | 'updated' | 'cancelled' | 'sent';
    actorName: string;
    companyName: string;
    details?: Record<string, any>;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('payment_reminder_logs')
      .insert({
        reminder_id: params.reminderId,
        order_id: params.orderId,
        action: params.action,
        actor_id: user?.id || null,
        actor_name: params.actorName,
        company_name: params.companyName,
        details: params.details || null,
      });

    if (error) {
      console.error('Error logging reminder action:', error);
      // Don't throw - logging should not break the main flow
    }
  },

  async getRecentLogs(
    limit: number = 30, 
    offset: number = 0, 
    filters?: LogFilters,
    sort: SortOption = 'newest'
  ): Promise<PaymentReminderLog[]> {
    let query = supabase
      .from('payment_reminder_logs')
      .select('*');

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'company_asc':
        query = query.order('company_name', { ascending: true, nullsFirst: false });
        break;
      case 'company_desc':
        query = query.order('company_name', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply filters
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.actorName) {
      query = query.eq('actor_name', filters.actorName);
    }
    if (filters?.companySearch) {
      query = query.ilike('company_name', `%${filters.companySearch}%`);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching reminder logs:', error);
      return [];
    }

    return (data || []) as PaymentReminderLog[];
  },

  async getUniqueActors(): Promise<string[]> {
    const { data, error } = await supabase
      .from('payment_reminder_logs')
      .select('actor_name')
      .order('actor_name');

    if (error) {
      console.error('Error fetching unique actors:', error);
      return [];
    }

    // Get unique actor names
    const uniqueActors = [...new Set((data || []).map(d => d.actor_name))];
    return uniqueActors;
  },

  subscribeToLogs(onLog: (log: PaymentReminderLog) => void): () => void {
    const channel = supabase
      .channel('payment-reminder-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_reminder_logs'
        },
        (payload) => {
          onLog(payload.new as PaymentReminderLog);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
