import { supabase } from "@/integrations/supabase/client";

export interface ClientUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Fetch all users with the 'client' role for the dropdown
 */
export async function getClientUsers(): Promise<ClientUser[]> {
  // First get all user_ids with client role
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "client");

  if (roleError) {
    console.error("Error fetching client roles:", roleError);
    return [];
  }

  if (!roleData || roleData.length === 0) {
    return [];
  }

  const clientUserIds = roleData.map((r) => r.user_id);

  // Then fetch profiles for these users
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", clientUserIds);

  if (profileError) {
    console.error("Error fetching client profiles:", profileError);
    return [];
  }

  // Get emails from app_users table
  const { data: appUsers, error: appUsersError } = await supabase
    .from("app_users")
    .select("id, email")
    .in("id", clientUserIds);

  if (appUsersError) {
    console.error("Error fetching app users:", appUsersError);
  }

  const emailMap = new Map(appUsers?.map((u) => [u.id, u.email]) || []);

  return (profiles || []).map((p) => ({
    id: p.id,
    name: `${p.first_name} ${p.last_name}`.trim() || "Unnamed Client",
    email: emailMap.get(p.id) || "",
  }));
}

/**
 * Get details of a specific client by ID
 */
export async function getClientById(clientId: string): Promise<ClientUser | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("id", clientId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Error fetching client profile:", profileError);
    return null;
  }

  const { data: appUser } = await supabase
    .from("app_users")
    .select("email")
    .eq("id", clientId)
    .maybeSingle();

  return {
    id: profile.id,
    name: `${profile.first_name} ${profile.last_name}`.trim() || "Unnamed Client",
    email: appUser?.email || "",
  };
}

/**
 * Link a client to an order by updating client_id
 */
export async function linkClientToOrder(
  orderId: string,
  clientId: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("orders")
    .update({ client_id: clientId, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    console.error("Error linking client to order:", error);
    return { success: false, error: error.message };
  }

  // Log the action
  await supabase.from("order_audit_logs").insert({
    order_id: orderId,
    actor_id: actorId,
    action: "Client Access Granted",
    details: `Client linked to order`,
  });

  return { success: true };
}

/**
 * Unlink client from order (set client_id to null)
 */
export async function unlinkClientFromOrder(
  orderId: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("orders")
    .update({ client_id: null, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    console.error("Error unlinking client from order:", error);
    return { success: false, error: error.message };
  }

  // Log the action
  await supabase.from("order_audit_logs").insert({
    order_id: orderId,
    actor_id: actorId,
    action: "Client Access Revoked",
    details: `Client unlinked from order`,
  });

  return { success: true };
}

/**
 * Log a mock invite action
 */
export async function logInviteSent(
  orderId: string,
  actorId: string,
  clientEmail: string
): Promise<void> {
  await supabase.from("order_audit_logs").insert({
    order_id: orderId,
    actor_id: actorId,
    action: "Login Invite Sent",
    details: `Login invite sent to ${clientEmail}`,
  });
}
