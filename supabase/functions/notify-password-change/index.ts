import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { passwordChangeEmail } from "../_shared/passwordChangeEmail.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Any password in the request is ignored: it must never be emailed.
    const { userEmail, userName, companyName } = await req.json();
    const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY_ABMEDIA") ?? Deno.env.get("RESEND_API_KEY"));

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const adminEmails = ["jungabmedia@gmail.com", "kleinabmedia1@gmail.com"];
    const { subject, html } = passwordChangeEmail({ userEmail, userName, companyName });

    for (const email of adminEmails) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Media Marketing <noreply@mediaamarketing.com>",
          to: [email],
          subject,
          html,
        }),
      });
      const bodyText = await res.text();
      if (!res.ok) {
        console.error(`Resend send failed for ${email} [${res.status}]: ${bodyText}`);
      } else {
        console.log(`Password-change email sent to ${email}: ${bodyText}`);
      }
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
