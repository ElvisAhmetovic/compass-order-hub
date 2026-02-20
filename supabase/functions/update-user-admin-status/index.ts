import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UpdateAdminRequest {
  userId: string;
  makeAdmin: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("authorization");

    // Create client for auth check
    const supabaseAuth = createClient(
      supabaseUrl, 
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader || "" },
        },
      }
    );

    // Verify the calling user is an admin
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if calling user is admin
    const { data: callerProfile } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Only admins can update user roles" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create admin client for updates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { userId, makeAdmin }: UpdateAdminRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const role = makeAdmin ? 'admin' : 'user';

    // Update profile role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return new Response(
        JSON.stringify({ error: `Failed to update profile: ${profileError.message}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (makeAdmin) {
      // Check if user_permissions entry exists
      const { data: existingPermissions } = await supabaseAdmin
        .from("user_permissions")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingPermissions) {
        // Update existing permissions
        const { error: updateError } = await supabaseAdmin
          .from("user_permissions")
          .update({
            role: 'admin',
            dashboard_access: true,
            active_orders_view: true,
            active_orders_modify: true,
            complaints_view: true,
            complaints_modify: true,
            completed_view: true,
            completed_modify: true,
            cancelled_view: true,
            cancelled_modify: true,
            deleted_view: true,
            deleted_modify: true,
            invoice_sent_view: true,
            invoice_sent_modify: true,
            invoice_paid_view: true,
            invoice_paid_modify: true,
            companies_view: true,
            companies_modify: true,
            reviews_view: true,
            reviews_modify: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating permissions:", updateError);
          return new Response(
            JSON.stringify({ error: `Failed to update permissions: ${updateError.message}` }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        // Insert new permissions
        const { error: insertError } = await supabaseAdmin
          .from("user_permissions")
          .insert({
            id: userId,
            role: 'admin',
            dashboard_access: true,
            active_orders_view: true,
            active_orders_modify: true,
            complaints_view: true,
            complaints_modify: true,
            completed_view: true,
            completed_modify: true,
            cancelled_view: true,
            cancelled_modify: true,
            deleted_view: true,
            deleted_modify: true,
            invoice_sent_view: true,
            invoice_sent_modify: true,
            invoice_paid_view: true,
            invoice_paid_modify: true,
            companies_view: true,
            companies_modify: true,
            reviews_view: true,
            reviews_modify: true
          });

        if (insertError) {
          console.error("Error inserting permissions:", insertError);
          return new Response(
            JSON.stringify({ error: `Failed to create permissions: ${insertError.message}` }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    } else {
      // Remove or update to basic user permissions
      const { error: permissionError } = await supabaseAdmin
        .from("user_permissions")
        .update({
          role: 'user',
          dashboard_access: true,
          active_orders_view: false,
          active_orders_modify: false,
          complaints_view: false,
          complaints_modify: false,
          completed_view: false,
          completed_modify: false,
          cancelled_view: false,
          cancelled_modify: false,
          deleted_view: false,
          deleted_modify: false,
          invoice_sent_view: false,
          invoice_sent_modify: false,
          invoice_paid_view: false,
          invoice_paid_modify: false,
          companies_view: false,
          companies_modify: false,
          reviews_view: false,
          reviews_modify: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (permissionError) {
        console.error("Error updating permissions:", permissionError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${makeAdmin ? 'promoted to admin' : 'demoted to user'}`,
        userId,
        role
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in update-user-admin-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
