
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";

export class OrderService {
  // Get all orders with proper error handling
  static async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

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

  // Create new order with validation
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
      
      return data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  // Update order with validation
  static async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    try {
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
      
      return data;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }

  // Delete order
  static async deleteOrder(id: string): Promise<void> {
    try {
      console.log('Deleting order:', id);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting order:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  }

  // Get orders by status
  static async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

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
      
      return data;
    } catch (error) {
      console.error('Failed to unassign order:', error);
      throw error;
    }
  }
}
