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
 * Notify all admins about a new support inquiry or reply
 */
async function notifyAdmins(params: {
  title: string;
  message: string;
  actionUrl: string;
}): Promise<void> {
  try {
    // Get all admin user IDs from user_roles table
    const { data: admins, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log("No admins found to notify");
      return;
    }

    // Create notifications for all admins
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      title: params.title,
      message: params.message,
      type: "info" as const,
      action_url: params.actionUrl,
      read: false
    }));

    const { error: notifyError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifyError) {
      console.error("Error creating admin notifications:", notifyError);
    }
  } catch (error) {
    console.error("Error in notifyAdmins:", error);
  }
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

  // Notify all admins about the new inquiry
  await notifyAdmins({
    title: "New Support Inquiry",
    message: `${userName} submitted: "${params.subject}"`,
    actionUrl: `/support/${data.id}`
  });

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

  // Get profile info including role from user_roles
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  // Check if user is a client from user_roles table
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const isClient = userRole?.role === "client";

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || "Client"
    : "Client";

  const { error } = await supabase.from("support_replies").insert({
    inquiry_id: inquiryId,
    user_id: userData.user.id,
    user_name: userName,
    user_role: userRole?.role || profile?.role || "client",
    message,
  });

  if (error) {
    console.error("Error adding reply:", error);
    return { success: false, error: error.message };
  }

  // If the replier is a client, notify all admins
  if (isClient) {
    // Get inquiry subject for context
    const { data: inquiry } = await supabase
      .from("support_inquiries")
      .select("subject")
      .eq("id", inquiryId)
      .maybeSingle();

    if (inquiry) {
      await notifyAdmins({
        title: "New Support Reply",
        message: `${userName} replied to: "${inquiry.subject}"`,
        actionUrl: `/support/${inquiryId}`
      });
    }
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
