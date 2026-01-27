import { supabase } from '@/integrations/supabase/client';

interface ClientNotificationParams {
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: {
    id: string;
    name: string;
  };
  customMessage?: string;
}

/**
 * Service for sending notifications to clients linked to orders
 */
export class ClientNotificationService {
  private static lastNotification: Map<string, number> = new Map();

  /**
   * Send automatic status change notification to the linked client
   */
  static async notifyClientStatusChange(params: ClientNotificationParams): Promise<{ success: boolean; error?: string }> {
    const { orderId, newStatus, changedBy, customMessage } = params;

    // Prevent duplicate notifications within 30 seconds
    const notificationKey = `client-${orderId}-${newStatus}`;
    const lastNotificationTime = this.lastNotification.get(notificationKey);
    const now = Date.now();
    
    if (lastNotificationTime && (now - lastNotificationTime) < 30000) {
      console.log('Duplicate client notification prevented for:', notificationKey);
      return { success: false, error: 'Duplicate notification prevented' };
    }

    this.lastNotification.set(notificationKey, now);

    try {
      const { data, error } = await supabase.functions.invoke('send-client-status-notification', {
        body: params,
      });

      if (error) {
        console.error('Error sending client notification:', error);
        return { success: false, error: error.message };
      }

      if (data?.error) {
        console.log('Client notification skipped:', data.error || data.message);
        return { success: false, error: data.error || data.message };
      }

      console.log('Client notification sent successfully:', data);
      return { success: true };
    } catch (error: any) {
      console.error('Exception sending client notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a manual update/message to the linked client
   */
  static async sendManualUpdate(params: {
    orderId: string;
    message: string;
    senderId: string;
    senderName: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.notifyClientStatusChange({
      orderId: params.orderId,
      oldStatus: null,
      newStatus: 'Update',
      changedBy: {
        id: params.senderId,
        name: params.senderName,
      },
      customMessage: params.message,
    });
  }
}
