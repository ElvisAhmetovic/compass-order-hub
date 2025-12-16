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
  },

  async getActiveRemindersStats(): Promise<{
    totalCount: number;
    dueTodayCount: number;
    totalValue: number;
  }> {
    // Fetch all scheduled reminders with order details
    const { data: reminders, error: remindersError } = await supabase
      .from('payment_reminders')
      .select('order_id, remind_at')
      .eq('status', 'scheduled');

    if (remindersError) throw remindersError;

    if (!reminders || reminders.length === 0) {
      return { totalCount: 0, dueTodayCount: 0, totalValue: 0 };
    }

    // Get unique order IDs
    const orderIds = [...new Set(reminders.map(r => r.order_id))];

    // Fetch order prices
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, price')
      .in('id', orderIds);

    if (ordersError) throw ordersError;

    // Calculate total value
    const totalValue = (orders || []).reduce((sum, order) => {
      return sum + (parseFloat(order.price?.toString() || '0') || 0);
    }, 0);

    // Calculate due today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueTodayCount = reminders.filter(r => {
      const remindAt = new Date(r.remind_at);
      return remindAt >= today && remindAt < tomorrow;
    }).length;

    return {
      totalCount: reminders.length,
      dueTodayCount,
      totalValue
    };
  },

  async getAllActiveRemindersWithOrders(): Promise<Array<PaymentReminder & { order: { id: string; company_name: string; price: number | null; contact_email: string | null } }>> {
    const { data: reminders, error: remindersError } = await supabase
      .from('payment_reminders')
      .select('*')
      .eq('status', 'scheduled')
      .order('remind_at', { ascending: true });

    if (remindersError) throw remindersError;
    if (!reminders || reminders.length === 0) return [];

    const orderIds = [...new Set(reminders.map(r => r.order_id))];

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, company_name, price, contact_email')
      .in('id', orderIds);

    if (ordersError) throw ordersError;

    const ordersMap = new Map((orders || []).map(o => [o.id, o]));

    return reminders.map(reminder => ({
      ...reminder as PaymentReminder,
      order: ordersMap.get(reminder.order_id) || { 
        id: reminder.order_id, 
        company_name: 'Unknown', 
        price: null, 
        contact_email: null 
      }
    }));
  }
};
