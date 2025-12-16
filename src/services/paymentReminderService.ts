import { supabase } from "@/integrations/supabase/client";

export interface PaymentReminder {
  id: string;
  order_id: string;
  remind_at: string;
  status: 'scheduled' | 'sent' | 'cancelled';
  note: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export const PaymentReminderService = {
  async createReminder(
    orderId: string,
    remindAt: Date,
    note: string | null,
    createdByName: string
  ): Promise<PaymentReminder> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Cancel any existing scheduled reminders for this order
    await supabase
      .from('payment_reminders')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId)
      .eq('status', 'scheduled');

    const { data, error } = await supabase
      .from('payment_reminders')
      .insert({
        order_id: orderId,
        remind_at: remindAt.toISOString(),
        note,
        created_by: user.id,
        created_by_name: createdByName,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    return data as PaymentReminder;
  },

  async getReminderForOrder(orderId: string): Promise<PaymentReminder | null> {
    const { data, error } = await supabase
      .from('payment_reminders')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'scheduled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as PaymentReminder | null;
  },

  async cancelReminder(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_reminders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;
  },

  async updateReminder(
    id: string,
    remindAt: Date,
    note: string | null
  ): Promise<PaymentReminder> {
    const { data, error } = await supabase
      .from('payment_reminders')
      .update({
        remind_at: remindAt.toISOString(),
        note
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PaymentReminder;
  },

  async getRemindersForOrders(orderIds: string[]): Promise<Record<string, PaymentReminder>> {
    if (orderIds.length === 0) return {};

    const { data, error } = await supabase
      .from('payment_reminders')
      .select('*')
      .in('order_id', orderIds)
      .eq('status', 'scheduled');

    if (error) throw error;

    const reminderMap: Record<string, PaymentReminder> = {};
    (data || []).forEach((reminder) => {
      reminderMap[reminder.order_id] = reminder as PaymentReminder;
    });
    return reminderMap;
  }
};
