import { supabase } from "@/integrations/supabase/client";

export interface ClientOrder {
  id: string;
  company_name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  price: number | null;
  currency: string | null;
  priority: string | null;
  status_created: boolean | null;
  status_in_progress: boolean | null;
  status_invoice_sent: boolean | null;
  status_invoice_paid: boolean | null;
  status_resolved: boolean | null;
  status_cancelled: boolean | null;
  contact_email: string | null;
  contact_phone: string | null;
  company_id: string | null;
  client_id: string | null;
  client_user_id: string | null;
  linked_company_name: string | null;
  company_email: string | null;
  client_visible_update: string | null;
  client_action_url: string | null;
}

export const fetchClientOrders = async (): Promise<ClientOrder[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch orders through the client_orders view using client_id (direct link)
  // Falls back to client_user_id for backwards compatibility
  const { data, error } = await supabase
    .from("client_orders")
    .select("*")
    .or(`client_id.eq.${user.id},client_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client orders:", error);
    throw error;
  }

  return (data as ClientOrder[]) || [];
};

export const fetchClientOrderById = async (orderId: string): Promise<ClientOrder | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("client_orders")
    .select("*")
    .eq("id", orderId)
    .or(`client_id.eq.${user.id},client_user_id.eq.${user.id}`)
    .maybeSingle();

  if (error) {
    console.error("Error fetching client order:", error);
    throw error;
  }

  return data as ClientOrder | null;
};

export const getClientCompany = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, email, phone, address, contact_person")
    .eq("client_user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching client company:", error);
    throw error;
  }

  return data;
};

export const getClientOrderStats = async () => {
  const orders = await fetchClientOrders();
  
  return {
    total: orders.length,
    inProgress: orders.filter(o => o.status_in_progress).length,
    invoiceSent: orders.filter(o => o.status_invoice_sent).length,
    invoicePaid: orders.filter(o => o.status_invoice_paid).length,
    resolved: orders.filter(o => o.status_resolved).length,
  };
};

export interface OrderAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
  uploaded_by_name: string;
}

export const getOrderAttachments = async (orderId: string): Promise<OrderAttachment[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("file_attachments")
    .select("id, file_name, file_url, file_type, file_size, created_at, uploaded_by_name")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching order attachments:", error);
    throw error;
  }

  return (data as OrderAttachment[]) || [];
};
