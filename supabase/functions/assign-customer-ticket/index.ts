import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin/agent
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "agent"].includes(profile.role)) throw new Error("Forbidden");

    const { ticketId, clientId, clientName, clientEmail, orderId, subject } = await req.json();

    // Update the customer ticket
    const { error: updateError } = await supabase
      .from("customer_tickets")
      .update({
        assigned_client_id: clientId,
        assigned_client_name: clientName,
        assigned_client_email: clientEmail,
      })
      .eq("id", ticketId);

    if (updateError) throw updateError;

    // Create support inquiry for the client so it shows in their portal
    const { error: inquiryError } = await supabase
      .from("support_inquiries")
      .insert({
        user_id: clientId,
        user_email: clientEmail,
        user_name: clientName || clientEmail,
        subject: subject || "Support Request",
        message: `Support ticket created from customer request. Original ticket from: ${clientEmail}`,
        status: "open",
        order_id: orderId,
      });

    if (inquiryError) throw inquiryError;

    // Create notification for the client
    await supabase.from("notifications").insert({
      user_id: clientId,
      title: "New Support Ticket",
      message: `A support ticket "${subject}" has been assigned to you.`,
      type: "support",
      action_url: "/client/support",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
