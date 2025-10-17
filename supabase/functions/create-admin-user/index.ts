import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create the admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: "ajosesales36@gmail.com",
      password: "Admin@12345!",
      email_confirm: true, // Skip email verification
      user_metadata: {
        first_name: "Admir",
        last_name: "Karalic",
        role: "admin"
      }
    });

    if (userError) {
      console.error("Error creating user:", userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User created successfully:", userData.user.id);

    // Update the profile to set admin role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: "admin", first_name: "Admir", last_name: "Karalic" })
      .eq("id", userData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Don't fail the request if profile update fails, the user is still created
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user created successfully",
        user_id: userData.user.id,
        email: userData.user.email
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in create-admin-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
