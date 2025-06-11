
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus } from '@/types';
import { NotificationService } from './notificationService';
import { OrderService } from './orderService';

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'status_change' | 'time_based' | 'manual';
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  created_by: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface WorkflowAction {
  type: 'set_status' | 'assign_user' | 'send_notification' | 'create_task';
  parameters: Record<string, any>;
}

export class WorkflowService {
  // Automatic status transitions when certain actions occur
  static async handleInvoiceCreated(orderId: string) {
    try {
      console.log(`Handling invoice created for order ${orderId}`);
      
      // Auto-set "Invoice Sent" status when invoice is created
      await OrderService.toggleOrderStatus(orderId, "Invoice Sent", true);
      
      // Get order details for notifications
      const order = await OrderService.getOrder(orderId);
      if (!order) return;

      // Send notification to assigned user
      if (order.assigned_to) {
        await NotificationService.createNotification({
          user_id: order.assigned_to,
          title: 'Invoice Created',
          message: `Invoice has been automatically created for order from ${order.company_name}`,
          type: 'success',
          order_id: orderId,
          action_url: `/dashboard?order=${orderId}`
        });
      }

      console.log('Invoice creation workflow completed');
    } catch (error) {
      console.error('Error in invoice creation workflow:', error);
    }
  }

  // Automatic assignment based on workload
  static async autoAssignOrder(orderId: string) {
    try {
      console.log(`Auto-assigning order ${orderId}`);
      
      // Get all users with 'user' or 'agent' role
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['user', 'agent']);

      if (error || !users || users.length === 0) {
        console.log('No available users for auto-assignment');
        return;
      }

      // Get current workload for each user
      const userWorkloads = await Promise.all(
        users.map(async (user) => {
          const orders = await OrderService.getOrders();
          const assignedOrders = orders.filter(order => 
            order.assigned_to === user.id && 
            !order.status_resolved && 
            !order.status_cancelled && 
            !order.status_deleted
          );
          
          return {
            userId: user.id,
            userName: `${user.first_name} ${user.last_name}`.trim() || 'Unknown',
            workload: assignedOrders.length
          };
        })
      );

      // Find user with least workload
      const leastBusyUser = userWorkloads.reduce((min, current) => 
        current.workload < min.workload ? current : min
      );

      // Assign order to least busy user
      await OrderService.assignOrder(orderId, leastBusyUser.userId, leastBusyUser.userName);

      console.log(`Order ${orderId} auto-assigned to ${leastBusyUser.userName}`);
    } catch (error) {
      console.error('Error in auto-assignment workflow:', error);
    }
  }

  // Handle payment received workflow
  static async handlePaymentReceived(orderId: string) {
    try {
      console.log(`Handling payment received for order ${orderId}`);
      
      // Auto-set "Invoice Paid" status
      await OrderService.toggleOrderStatus(orderId, "Invoice Paid", true);
      
      // Remove "Invoice Sent" status as it's now paid
      await OrderService.toggleOrderStatus(orderId, "Invoice Sent", false);
      
      // Get order details
      const order = await OrderService.getOrder(orderId);
      if (!order) return;

      // Send notification to assigned user
      if (order.assigned_to) {
        await NotificationService.createNotification({
          user_id: order.assigned_to,
          title: 'Payment Received',
          message: `Payment has been received for order from ${order.company_name}`,
          type: 'success',
          order_id: orderId,
          action_url: `/dashboard?order=${orderId}`
        });
      }

      console.log('Payment received workflow completed');
    } catch (error) {
      console.error('Error in payment received workflow:', error);
    }
  }

  // Handle complaint resolution workflow
  static async handleComplaintResolved(orderId: string) {
    try {
      console.log(`Handling complaint resolved for order ${orderId}`);
      
      // Remove complaint status and set resolved
      await OrderService.toggleOrderStatus(orderId, "Complaint", false);
      await OrderService.toggleOrderStatus(orderId, "Resolved", true);
      
      // Get order details
      const order = await OrderService.getOrder(orderId);
      if (!order) return;

      // Send notification to assigned user
      if (order.assigned_to) {
        await NotificationService.createNotification({
          user_id: order.assigned_to,
          title: 'Complaint Resolved',
          message: `Complaint for order from ${order.company_name} has been resolved`,
          type: 'success',
          order_id: orderId,
          action_url: `/dashboard?order=${orderId}`
        });
      }

      console.log('Complaint resolution workflow completed');
    } catch (error) {
      console.error('Error in complaint resolution workflow:', error);
    }
  }

  // Time-based workflow - mark old orders for review
  static async checkForReviewRequiredOrders() {
    try {
      console.log('Checking for orders requiring review');
      
      const orders = await OrderService.getOrders();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const order of orders) {
        const orderDate = new Date(order.created_at || '');
        
        // Mark orders older than 30 days that are still in progress for review
        if (orderDate < thirtyDaysAgo && 
            order.status_in_progress && 
            !order.status_resolved && 
            !order.status_cancelled && 
            !order.status_review) {
          
          await OrderService.toggleOrderStatus(order.id, "Review", true);
          
          // Send notification to assigned user
          if (order.assigned_to) {
            await NotificationService.createNotification({
              user_id: order.assigned_to,
              title: 'Order Needs Review',
              message: `Order from ${order.company_name} has been in progress for over 30 days and needs review`,
              type: 'warning',
              order_id: order.id,
              action_url: `/dashboard?order=${order.id}`
            });
          }
        }
      }

      console.log('Review check workflow completed');
    } catch (error) {
      console.error('Error in review check workflow:', error);
    }
  }
}
