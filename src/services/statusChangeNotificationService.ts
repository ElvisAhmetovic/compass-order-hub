import { supabase } from '@/integrations/supabase/client';

interface StatusChangeParams {
  orderId: string;
  status: string;
  enabled: boolean;
  changedBy: {
    id: string;
    name: string;
  };
  orderData: any;
}

export class StatusChangeNotificationService {
  private static lastNotification: Map<string, number> = new Map();

  static async notifyStatusChange(params: StatusChangeParams): Promise<void> {
    const { orderId, status, enabled, changedBy, orderData } = params;

    // Only send notifications when status is being enabled (added)
    if (!enabled) {
      console.log('Status disabled, no notification sent');
      return;
    }

    // Prevent duplicate notifications within 1 minute
    const notificationKey = `${orderId}-${status}`;
    const lastNotificationTime = this.lastNotification.get(notificationKey);
    const now = Date.now();
    
    if (lastNotificationTime && (now - lastNotificationTime) < 60000) {
      console.log('Duplicate notification prevented for:', notificationKey);
      return;
    }

    this.lastNotification.set(notificationKey, now);

    try {
      // Get active statuses from order to determine old status
      const activeStatuses = this.getActiveStatuses(orderData);
      const oldStatus = activeStatuses.length > 1 
        ? activeStatuses.filter(s => s !== status)[0] || null
        : null;

      // Call edge function using Supabase SDK for proper CORS handling
      const { data, error } = await supabase.functions.invoke('send-status-change-notification', {
        body: {
          orderId,
          oldStatus,
          newStatus: this.formatStatusName(status),
          changedBy,
        },
      });

      if (error) {
        console.error('Failed to send status change notification:', error);
      } else {
        console.log('Status change notification sent:', data);
      }
    } catch (error) {
      console.error('Error sending status change notification:', error);
      // Don't throw - we don't want to block the status update if email fails
    }
  }

  private static formatStatusName(status: string): string {
    // Convert snake_case to Title Case
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static getActiveStatuses(order: any): string[] {
    const statuses: string[] = [];
    const statusFields = [
      'status_created',
      'status_in_progress',
      'status_invoice_sent',
      'status_invoice_paid',
      'status_complaint',
      'status_resolved',
      'status_cancelled',
      'status_deleted',
      'status_review',
      'status_facebook',
      'status_instagram',
      'status_trustpilot',
      'status_trustpilot_deletion',
      'status_google_deletion',
    ];

    statusFields.forEach(field => {
      if (order[field] === true) {
        // Remove 'status_' prefix and format
        const statusName = field.replace('status_', '');
        statuses.push(this.formatStatusName(statusName));
      }
    });

    return statuses;
  }
}
