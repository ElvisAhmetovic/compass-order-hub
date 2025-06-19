import { supabase } from "@/integrations/supabase/client";
import { Order, OrderStatus } from "@/types";

export class OrderService {
  // Get all orders with proper error handling - now excludes soft deleted orders by default
  static async getOrders(includeYearlyPackages: boolean = false, includeDeleted: boolean = false): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*');
      
      if (!includeYearlyPackages) {
        query = query.neq('is_yearly_package', true);
      }
      
      // Exclude soft deleted orders unless specifically requested
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get orders:', error);
      throw error;
    }
  }

  // Get only deleted orders
  static async getDeletedOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error fetching deleted orders:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get deleted orders:', error);
      throw error;
    }
  }

  // Get order by ID
  static async getOrder(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get order:', error);
      throw error;
    }
  }

  // Create new order with validation and activity logging
  static async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    try {
      // Validate required fields
      if (!orderData.company_name) {
        throw new Error('Company name is required');
      }
      if (!orderData.contact_email) {
        throw new Error('Contact email is required');
      }
      if (!orderData.description) {
        throw new Error('Description is required');
      }

      // Ensure company_link is properly formatted if provided
      let formattedLink = orderData.company_link;
      if (formattedLink && !formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
        formattedLink = 'https://' + formattedLink;
      }

      const cleanOrderData = {
        ...orderData,
        company_link: formattedLink,
        price: orderData.price || 0,
        status: orderData.status || 'Created',
        priority: orderData.priority || 'medium'
      };

      console.log('Creating order with data:', cleanOrderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(cleanOrderData)
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      // Log order creation activity
      await this.logOrderActivity(data.id, 'Order Created', `Order created for ${data.company_name}`);
      
      return data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  // Create new yearly package order
  static async createYearlyPackage(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> & { is_yearly_package: boolean }): Promise<Order> {
    try {
      // Validate required fields
      if (!orderData.company_name) {
        throw new Error('Company name is required');
      }
      if (!orderData.contact_email) {
        throw new Error('Contact email is required');
      }
      if (!orderData.description) {
        throw new Error('Description is required');
      }

      // Ensure company_link is properly formatted if provided
      let formattedLink = orderData.company_link;
      if (formattedLink && !formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
        formattedLink = 'https://' + formattedLink;
      }

      const cleanOrderData = {
        ...orderData,
        company_link: formattedLink,
        price: orderData.price || 0,
        status: orderData.status || 'Created',
        priority: orderData.priority || 'medium',
        is_yearly_package: true // Ensure this is always true for yearly packages
      };

      console.log('Creating yearly package with data:', cleanOrderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(cleanOrderData)
        .select()
        .single();

      if (error) {
        console.error('Error creating yearly package:', error);
        throw error;
      }

      // Log yearly package creation activity
      await this.logOrderActivity(data.id, 'Yearly Package Created', `Yearly package created for ${data.company_name}`);
      
      return data;
    } catch (error) {
      console.error('Failed to create yearly package:', error);
      throw error;
    }
  }

  // Get yearly packages only
  static async getYearlyPackages(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('is_yearly_package', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching yearly packages:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get yearly packages:', error);
      throw error;
    }
  }

  // Update order with validation - now handles multiple statuses and logs activity
  static async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    try {
      // Get current order for comparison
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      // Clean the data before updating
      const cleanData = { ...orderData };
      
      // Format company link if it's being updated
      if (cleanData.company_link && !cleanData.company_link.startsWith('http://') && !cleanData.company_link.startsWith('https://')) {
        cleanData.company_link = 'https://' + cleanData.company_link;
      }

      console.log('Updating order with data:', cleanData);

      const { data, error } = await supabase
        .from('orders')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }

      // Log specific changes
      const changes = [];
      if (currentOrder) {
        if (cleanData.company_name && cleanData.company_name !== currentOrder.company_name) {
          changes.push(`Company name changed from "${currentOrder.company_name}" to "${cleanData.company_name}"`);
        }
        if (cleanData.price !== undefined && cleanData.price !== currentOrder.price) {
          changes.push(`Price changed from ${currentOrder.price} to ${cleanData.price}`);
        }
        if (cleanData.priority && cleanData.priority !== currentOrder.priority) {
          changes.push(`Priority changed from ${currentOrder.priority} to ${cleanData.priority}`);
        }
        if (cleanData.assigned_to !== undefined && cleanData.assigned_to !== currentOrder.assigned_to) {
          if (cleanData.assigned_to) {
            changes.push(`Order assigned to ${cleanData.assigned_to_name || 'user'}`);
          } else {
            changes.push('Order unassigned');
          }
        }
      }

      if (changes.length > 0) {
        await this.logOrderActivity(id, 'Order Updated', changes.join('; '));
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }

  // Soft delete order instead of permanent deletion
  static async deleteOrder(id: string): Promise<void> {
    try {
      console.log('Soft deleting order:', id);

      // Get order info before soft deletion for logging
      const { data: orderToDelete } = await supabase
        .from('orders')
        .select('company_name')
        .eq('id', id)
        .single();

      // Use the soft delete function
      const { error } = await supabase.rpc('soft_delete_order', {
        order_id_param: id
      });

      if (error) {
        console.error('Error soft deleting order:', error);
        throw error;
      }

      // Log soft deletion activity
      if (orderToDelete) {
        await this.logOrderActivity(id, 'Order Soft Deleted', `Order for ${orderToDelete.company_name} was moved to deleted items`);
      }
    } catch (error) {
      console.error('Failed to soft delete order:', error);
      throw error;
    }
  }

  // Restore a soft deleted order
  static async restoreOrder(id: string): Promise<void> {
    try {
      console.log('Restoring order:', id);

      // Get order info before restoration for logging
      const { data: orderToRestore } = await supabase
        .from('orders')
        .select('company_name')
        .eq('id', id)
        .single();

      // Use the restore function
      const { error } = await supabase.rpc('restore_order', {
        order_id_param: id
      });

      if (error) {
        console.error('Error restoring order:', error);
        throw error;
      }

      // Log restoration activity
      if (orderToRestore) {
        await this.logOrderActivity(id, 'Order Restored', `Order for ${orderToRestore.company_name} was restored from deleted items`);
      }
    } catch (error) {
      console.error('Failed to restore order:', error);
      throw error;
    }
  }

  // Permanently delete an order (admin only)
  static async permanentlyDeleteOrder(id: string): Promise<void> {
    try {
      console.log('Permanently deleting order:', id);

      // Get order info before deletion for logging
      const { data: orderToDelete } = await supabase
        .from('orders')
        .select('company_name')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error permanently deleting order:', error);
        throw error;
      }

      // Log permanent deletion activity
      if (orderToDelete) {
        await this.logOrderActivity(id, 'Order Permanently Deleted', `Order for ${orderToDelete.company_name} was permanently deleted`);
      }
    } catch (error) {
      console.error('Failed to permanently delete order:', error);
      throw error;
    }
  }

  // Get orders by status - now supports multiple status filtering
  static async getOrdersByStatus(status: string, isYearlyPackages: boolean = false): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*');
      
      // Filter by yearly package status first
      if (isYearlyPackages) {
        query = query.eq('is_yearly_package', true);
      } else {
        query = query.neq('is_yearly_package', true);
      }
      
      // Map old status names to new boolean columns
      const statusColumnMap: Record<string, string> = {
        'Created': 'status_created',
        'In Progress': 'status_in_progress', 
        'Complaint': 'status_complaint',
        'Invoice Sent': 'status_invoice_sent',
        'Invoice Paid': 'status_invoice_paid',
        'Resolved': 'status_resolved',
        'Cancelled': 'status_cancelled',
        'Deleted': 'status_deleted',
        'Review': 'status_review'
      };

      const statusColumn = statusColumnMap[status];
      if (statusColumn) {
        query = query.eq(statusColumn, true);
      } else {
        // Fallback to old status column for backward compatibility
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders by status:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get orders by status:', error);
      throw error;
    }
  }

  // Assign order to user
  static async assignOrder(orderId: string, userId: string, userName: string): Promise<Order> {
    try {
      console.log(`Assigning order ${orderId} to user ${userId} (${userName})`);

      const { data, error } = await supabase
        .from('orders')
        .update({
          assigned_to: userId,
          assigned_to_name: userName,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error assigning order:', error);
        throw error;
      }

      // Log assignment activity
      await this.logOrderActivity(orderId, 'Order Assigned', `Order assigned to ${userName}`);
      
      return data;
    } catch (error) {
      console.error('Failed to assign order:', error);
      throw error;
    }
  }

  // Unassign order
  static async unassignOrder(orderId: string): Promise<Order> {
    try {
      console.log(`Unassigning order ${orderId}`);

      // Get current assignment info for logging
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('assigned_to_name')
        .eq('id', orderId)
        .single();

      const { data, error } = await supabase
        .from('orders')
        .update({
          assigned_to: null,
          assigned_to_name: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error unassigning order:', error);
        throw error;
      }

      // Log unassignment activity
      const previousAssignee = currentOrder?.assigned_to_name || 'Unknown user';
      await this.logOrderActivity(orderId, 'Order Unassigned', `Order unassigned from ${previousAssignee}`);
      
      return data;
    } catch (error) {
      console.error('Failed to unassign order:', error);
      throw error;
    }
  }

  // New method to toggle a specific status on an order
  static async toggleOrderStatus(orderId: string, status: OrderStatus, enabled: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current order to check existing status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;

    // Map status to database field
    const statusFieldMap: Record<OrderStatus, string> = {
      "Created": "status_created",
      "In Progress": "status_in_progress", 
      "Complaint": "status_complaint",
      "Invoice Sent": "status_invoice_sent",
      "Invoice Paid": "status_invoice_paid",
      "Resolved": "status_resolved",
      "Cancelled": "status_cancelled",
      "Deleted": "status_deleted",
      "Review": "status_review"
    };

    const statusField = statusFieldMap[status];
    if (!statusField) throw new Error(`Invalid status: ${status}`);

    // Update the status field
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        [statusField]: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Log the status change in order_status_history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: status,
        actor_id: user.id,
        actor_name: user.user_metadata?.full_name || user.email || 'Unknown',
        details: enabled ? `Status "${status}" added` : `Status "${status}" removed`
      });

    if (historyError) {
      console.error('Error logging status history:', historyError);
    }

    // Also log in audit logs for comprehensive tracking
    await this.logOrderActivity(orderId, 'Status Change', `Status "${status}" ${enabled ? 'added' : 'removed'}`);

    // Create notification for assigned user if order is assigned to someone else
    if (currentOrder.assigned_to && currentOrder.assigned_to !== user.id) {
      try {
        const { NotificationService } = await import('./notificationService');
        await NotificationService.createNotification({
          user_id: currentOrder.assigned_to,
          title: 'Order Status Updated',
          message: `Order for ${currentOrder.company_name} status changed: ${status} ${enabled ? 'added' : 'removed'}`,
          type: 'info',
          order_id: orderId,
          action_url: `/dashboard?order=${orderId}`
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }
  }

  // Get all active statuses for an order
  static getActiveStatuses(order: Order): OrderStatus[] {
    const statuses: OrderStatus[] = [];
    
    if (order.status_created) statuses.push('Created');
    if (order.status_in_progress) statuses.push('In Progress');
    if (order.status_complaint) statuses.push('Complaint');
    if (order.status_invoice_sent) statuses.push('Invoice Sent');
    if (order.status_invoice_paid) statuses.push('Invoice Paid');
    if (order.status_resolved) statuses.push('Resolved');
    if (order.status_cancelled) statuses.push('Cancelled');
    if (order.status_deleted) statuses.push('Deleted');
    if (order.status_review) statuses.push('Review');
    
    return statuses;
  }

  // New method to log order activities in audit logs
  static async logOrderActivity(orderId: string, action: string, details: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('order_audit_logs')
        .insert({
          order_id: orderId,
          actor_id: user?.id || null,
          action: action,
          details: details
        });

      if (error) {
        console.error('Error logging order activity:', error);
      }
    } catch (error) {
      console.error('Failed to log order activity:', error);
    }
  }
}
