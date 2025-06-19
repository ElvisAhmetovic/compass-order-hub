
import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  order_id?: string;
  action_url?: string;
}

export class RealTimeNotificationService {
  static async createNotification(data: NotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...data,
          read: false
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  static async notifyOrderChange(orderId: string, action: string, assignedUserId?: string) {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('company_name, assigned_to, assigned_to_name')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order for notification:', orderError);
        return;
      }

      // Notify assigned user if different from current user
      const { data: { user } } = await supabase.auth.getUser();
      if (assignedUserId && assignedUserId !== user?.id) {
        await this.createNotification({
          user_id: assignedUserId,
          title: 'Order Updated',
          message: `Order for ${order.company_name} has been ${action}`,
          type: 'info',
          order_id: orderId,
          action_url: `/dashboard?order=${orderId}`
        });
      }

      // Notify all admins about status changes
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        const notifications = admins
          .filter(admin => admin.id !== user?.id) // Don't notify the user who made the change
          .map(admin => ({
            user_id: admin.id,
            title: 'Order Status Changed',
            message: `Order for ${order.company_name} status updated: ${action}`,
            type: 'info' as const,
            order_id: orderId,
            action_url: `/dashboard?order=${orderId}`
          }));

        if (notifications.length > 0) {
          await supabase
            .from('notifications')
            .insert(notifications.map(n => ({ ...n, read: false })));
        }
      }
    } catch (error) {
      console.error('Error notifying order change:', error);
    }
  }

  static async notifyOrderAssignment(orderId: string, assignedUserId: string, assignedUserName: string) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('company_name')
        .eq('id', orderId)
        .single();

      if (order) {
        await this.createNotification({
          user_id: assignedUserId,
          title: 'New Order Assigned',
          message: `You have been assigned to order for ${order.company_name}`,
          type: 'info',
          order_id: orderId,
          action_url: `/dashboard?order=${orderId}`
        });
      }
    } catch (error) {
      console.error('Error notifying order assignment:', error);
    }
  }
}
