import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's token to verify they're an admin
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Claims error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;

    // Create admin client to check user's role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if the caller is an admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || callerProfile?.role !== "admin") {
      console.error("Profile check error:", profileError);
      return new Response(
        JSON.stringify({ error: "Only admins can create users" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user data from request body
    const { email, password, firstName, lastName, role, linkOrderId, sendLoginEmail } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate role
    const validRoles = ["user", "admin", "agent", "client"];
    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be one of: user, admin, agent, client" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Creating user with email:", email, "role:", role || "user");

    // Create the user using admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName || "",
        last_name: lastName || "",
        role: role || "user"
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

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the profile with the correct role and name
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        role: role || "user", 
        first_name: firstName || "", 
        last_name: lastName || "" 
      })
      .eq("id", userData.user.id);

    if (profileUpdateError) {
      console.error("Error updating profile:", profileUpdateError);
    }

    // Insert role into user_roles table (required for proper role-based access)
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userData.user.id,
        role: role || "user"
      });

    if (roleInsertError) {
      console.error("Error inserting user role:", roleInsertError);
    }

    // Insert into app_users table (for email lookup)
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || null;
    const { error: appUserError } = await supabaseAdmin
      .from("app_users")
      .insert({
        id: userData.user.id,
        email: email,
        role: role || "user",
        full_name: fullName
      });

    if (appUserError) {
      console.error("Error inserting app user:", appUserError);
    }

    // Link order if linkOrderId is provided
    if (linkOrderId) {
      const { error: linkError } = await supabaseAdmin
        .from("orders")
        .update({ client_id: userData.user.id })
        .eq("id", linkOrderId);
      
      if (linkError) {
        console.error("Error linking order:", linkError);
      } else {
        console.log("Order linked successfully:", linkOrderId);
      }
    }

    let loginEmailSent = false;
    if (sendLoginEmail === true && (role === "admin" || role === "agent")) {
      loginEmailSent = await sendTeamLoginEmail(email, firstName || "", password);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        login_email_sent: loginEmailSent,
        message: "User created successfully",
        user_id: userData.user.id,
        email: userData.user.email
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

async function sendTeamLoginEmail(to: string, firstName: string, password: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY_ABMEDIA");
  if (!key) { console.error("RESEND_API_KEY_ABMEDIA missing"); return false; }
  const loginUrl = "https://www.empriatech.com/login";
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
<h2 style="color:#0f2747">Welcome to the Empria team</h2>
<p>Hello ${esc(firstName || "there")},</p>
<p>An Empria admin has created your team account. You can sign in here:</p>
<p><a href="${loginUrl}" style="display:inline-block;background:#0f2747;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none">Sign in to Empria</a></p>
<p><strong>Email:</strong> ${esc(to)}<br/><strong>Temporary password:</strong> ${esc(password)}</p>
<p>Please change your password after your first sign-in.</p>
<p>Best regards,<br/>Media Marketing</p></div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Media Marketing <noreply@mediaamarketing.com>", to: [to], subject: "Your Empria team account", html }),
    });
    if (!res.ok) { console.error("Login email failed", res.status, await res.text()); return false; }
    return true;
  } catch (e) { console.error("Login email error", e); return false; }
}

serve(handler);
