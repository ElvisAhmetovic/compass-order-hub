import { supabase } from "@/integrations/supabase/client";

export interface ClientSupportInquiry {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  message: string;
  created_at: string;
  status: "open" | "in_progress" | "closed";
  order_id: string | null;
  order_company_name?: string;
}

export interface ClientSupportReply {
  id: string;
  inquiry_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
}

/**
 * Fetch all support inquiries for the logged-in client
 */
export async function fetchClientInquiries(): Promise<ClientSupportInquiry[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("support_inquiries")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client inquiries:", error);
    return [];
  }

  // Fetch order company names for linked inquiries
  const orderIds = (data || [])
    .filter((i) => i.order_id)
    .map((i) => i.order_id);

  let orderMap = new Map<string, string>();
  if (orderIds.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, company_name")
      .in("id", orderIds);

    if (orders) {
      orderMap = new Map(orders.map((o) => [o.id, o.company_name]));
    }
  }

  return (data || []).map((inquiry) => ({
    id: inquiry.id,
    user_id: inquiry.user_id,
    user_email: inquiry.user_email,
    user_name: inquiry.user_name,
    subject: inquiry.subject,
    message: inquiry.message,
    created_at: inquiry.created_at,
    status: inquiry.status as "open" | "in_progress" | "closed",
    order_id: inquiry.order_id,
    order_company_name: inquiry.order_id ? orderMap.get(inquiry.order_id) : undefined,
  }));
}

/**
 * Fetch a specific inquiry with its replies
 */
export async function fetchClientInquiryById(
  inquiryId: string
): Promise<{ inquiry: ClientSupportInquiry | null; replies: ClientSupportReply[] }> {
  const { data: inquiry, error } = await supabase
    .from("support_inquiries")
    .select("*")
    .eq("id", inquiryId)
    .maybeSingle();

  if (error || !inquiry) {
    console.error("Error fetching inquiry:", error);
    return { inquiry: null, replies: [] };
  }

  // Fetch order company name if linked
  let orderCompanyName: string | undefined;
  if (inquiry.order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select("company_name")
      .eq("id", inquiry.order_id)
      .maybeSingle();

    orderCompanyName = order?.company_name;
  }

  // Fetch replies
  const { data: replies, error: repliesError } = await supabase
    .from("support_replies")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  if (repliesError) {
    console.error("Error fetching replies:", repliesError);
  }

  return {
    inquiry: {
      id: inquiry.id,
      user_id: inquiry.user_id,
      user_email: inquiry.user_email,
      user_name: inquiry.user_name,
      subject: inquiry.subject,
      message: inquiry.message,
      created_at: inquiry.created_at,
      status: inquiry.status as "open" | "in_progress" | "closed",
      order_id: inquiry.order_id,
      order_company_name: orderCompanyName,
    },
    replies: (replies || []).map((r) => ({
      id: r.id,
      inquiry_id: r.inquiry_id,
      user_id: r.user_id,
      user_name: r.user_name,
      user_role: r.user_role,
      message: r.message,
      created_at: r.created_at,
    })),
  };
}

/**
 * Create a new support inquiry
 */
export async function createClientInquiry(params: {
  subject: string;
  message: string;
  orderId?: string;
}): Promise<{ success: boolean; inquiryId?: string; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get profile info
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userData.user.id)
    .maybeSingle();

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || "Client"
    : "Client";

  const { data, error } = await supabase
    .from("support_inquiries")
    .insert({
      user_id: userData.user.id,
      user_email: userData.user.email || "",
      user_name: userName,
      subject: params.subject,
      message: params.message,
      status: "open",
      order_id: params.orderId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating inquiry:", error);
    return { success: false, error: error.message };
  }

  return { success: true, inquiryId: data.id };
}

/**
 * Add a reply to an existing inquiry
 */
export async function addClientReply(
  inquiryId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get profile info
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || "Client"
    : "Client";

  const { error } = await supabase.from("support_replies").insert({
    inquiry_id: inquiryId,
    user_id: userData.user.id,
    user_name: userName,
    user_role: profile?.role || "client",
    message,
  });

  if (error) {
    console.error("Error adding reply:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Fetch client's orders for linking to inquiries
 */
export async function fetchClientOrders(): Promise<
  { id: string; company_name: string }[]
> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, company_name")
    .eq("client_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client orders:", error);
    return [];
  }

  return data || [];
}
