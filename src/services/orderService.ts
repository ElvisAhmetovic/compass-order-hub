
import { supabase } from "@/integrations/supabase/client";

export interface Order {
  id: string;
  company_id?: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_address?: string;
  company_link?: string;
  description?: string;
  price?: number;
  status: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  amount?: number;
  currency?: string;
  agent_name?: string;
  status_date?: string;
}

export class OrderService {
  // Get all orders
  static async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get order by ID
  static async getOrder(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create new order
  static async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        created_by: user.data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update order
  static async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete order
  static async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Get orders by status
  static async getOrdersByStatus(status: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
