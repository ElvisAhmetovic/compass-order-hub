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

  async getRecentLogs(limit: number = 30): Promise<PaymentReminderLog[]> {
    const { data, error } = await supabase
      .from('payment_reminder_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching reminder logs:', error);
      return [];
    }

    return (data || []) as PaymentReminderLog[];
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
