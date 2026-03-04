import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEAM_EMAILS = [
  "angelina@abmedia-team.com",
  "service@team-abmedia.com",
  "thomas.thomasklein@gmail.com",
  "kleinabmedia@gmail.com",
  "jungabmedia@gmail.com",
  "wolfabmedia@gmail.com",
  "marcusabmedia@gmail.com",
  "paulkatz.abmedia@gmail.com",
  "ajosesales36@gmail.com",
  "georgabmediateam@gmail.com",
  "jannes@scoolfinanceedu.com",
  "johan@team-abmedia.com",
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      clientName,
      password,
      portalUrl,
      companyName,
      senderName,
      senderId,
      orderId,
      isResend,
    } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY_ABMEDIA");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY_ABMEDIA not configured");
    }

    const subject = isResend
      ? `Your Updated Client Portal Credentials - ${companyName || "ABMedia"}`
      : `Welcome to Your Client Portal - ${companyName || "ABMedia"}`;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isResend ? "🔑 Updated Credentials" : "🎉 Welcome to Your Client Portal"}
          </h1>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Hello <strong>${clientName || "Client"}</strong>,
        </p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          ${isResend
            ? "Your client portal credentials have been updated. Please use the new login details below:"
            : "Your client portal account has been created. You can now track your orders, view invoices, and communicate with our team directly."}
        </p>
        
        <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px 0; color: #333;">Your Login Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Portal URL:</td>
              <td style="padding: 8px 0;"><a href="${portalUrl}" style="color: #667eea; text-decoration: none;">${portalUrl}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
              <td style="padding: 8px 0; font-family: monospace;">${clientEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Password:</td>
              <td style="padding: 8px 0; font-family: monospace; background: #fff3cd; padding: 4px 8px; border-radius: 4px;">${password}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Go to Portal →
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          We recommend changing your password after your first login for security purposes.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;" />
        
        <p style="color: #999; font-size: 12px;">
          This email was sent by ${senderName || "the ABMedia team"}. If you did not expect this email, please ignore it.
        </p>
      </div>
    `;

    // Send to client
    const clientRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "ABMedia Team <noreply@abm-team.com>",
        to: [clientEmail],
        subject,
        html: htmlBody,
      }),
    });

    if (!clientRes.ok) {
      const err = await clientRes.text();
      console.error("Failed to send client email:", err);
      throw new Error(`Failed to send email to client: ${err}`);
    }

    console.log("Client portal credentials sent to:", clientEmail);

    // Send internal copy to team (batched to avoid rate limits)
    const internalSubject = `[Internal] Client Portal ${isResend ? "Re-sent" : "Created"}: ${clientName} (${clientEmail}) - ${companyName}`;
    const internalHtml = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Client Portal ${isResend ? "Credentials Re-sent" : "Account Created"}</h2>
        <ul>
          <li><strong>Client:</strong> ${clientName}</li>
          <li><strong>Email:</strong> ${clientEmail}</li>
          <li><strong>Company:</strong> ${companyName}</li>
          <li><strong>Order ID:</strong> ${orderId}</li>
          <li><strong>Created by:</strong> ${senderName}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        </ul>
        <p><strong>Password sent:</strong> <code>${password}</code></p>
      </div>
    `;

    // Send in batches of 2 with 1s delay
    for (let i = 0; i < TEAM_EMAILS.length; i += 2) {
      const batch = TEAM_EMAILS.slice(i, i + 2);
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: "ABMedia Team <noreply@abm-team.com>",
            to: batch,
            subject: internalSubject,
            html: internalHtml,
          }),
        });
      } catch (err) {
        console.error("Team email batch failed:", err);
      }
      if (i + 2 < TEAM_EMAILS.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Log to audit
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await supabaseAdmin.from("order_audit_logs").insert({
      order_id: orderId,
      actor_id: senderId,
      action: isResend ? "client_portal_credentials_resent" : "client_portal_credentials_sent",
      details: `Credentials ${isResend ? "re-sent" : "sent"} to ${clientEmail} for ${companyName}`,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-client-portal-credentials:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
