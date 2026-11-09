import { credentialsSubject } from "../_shared/portalEmailCopy.ts";
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
  "invoice@mediaamarketing.com",
  "jungabmedia@gmail.com",
  "wolfabmedia@gmail.com",
  "marcusabmedia@gmail.com",
  "paulkatz.abmedia@gmail.com",
  "ajosesales36@gmail.com",
  "georgabmediateam@gmail.com",
  "jannes@scoolfinanceedu.com",
  "Ikram@team-abmedia.com",
  "johan@team-abmedia.com",
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const bearerToken = authHeader.replace('Bearer ', '').trim();
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    // Allow trusted server-to-server calls from other edge functions (service role),
    // otherwise require a valid signed-in user.
    const isServiceCall = serviceRoleKey.length > 0 && bearerToken === serviceRoleKey;
    if (!isServiceCall) {
      const supabaseAuthClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    const APP_URL = Deno.env.get("APP_URL") || "https://www.empriatech.com";
    const portalUrl = `${APP_URL}/client/login`;

    const {
      clientEmail,
      clientName,
      password,
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

    const subject = credentialsSubject(!!isResend, companyName || "Media Marketing");
    const name = clientName || "Kunde / Client";
    const row = (l: string, v: string) => `<tr><td style="padding:8px 0;color:#666;font-weight:600;">${l}</td><td style="padding:8px 0;font-family:monospace;">${v}</td></tr>`;
    const htmlBody = `
      <div style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#333">
        <div style="background:#1e3a5f;border-radius:12px;padding:30px;margin-bottom:30px;">
          <h1 style="color:white;margin:0;font-size:22px;">${isResend ? "Ihre neuen Zugangsdaten / Your updated login" : "Willkommen im Kundenportal / Welcome to your client portal"}</h1>
        </div>
        <p style="font-size:16px;line-height:1.6;">Hallo <strong>${name}</strong>,</p>
        <p style="font-size:16px;line-height:1.6;">${isResend
          ? "Ihre Zugangsdaten für das Kundenportal wurden aktualisiert. Bitte verwenden Sie die folgenden Daten:"
          : "Ihr Kundenportal-Konto wurde erstellt. Dort sehen Sie Ihre Aufträge, Rechnungen und offene Zahlungen und können direkt mit unserem Team kommunizieren."}</p>
        <p style="font-size:14px;line-height:1.6;color:#555;"><em>${isResend
          ? "Your client portal login has been updated. Please use the details below:"
          : "Your client portal account has been created. There you can see your orders, invoices and open payments and talk to our team directly."}</em></p>
        <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:20px;margin:24px 0;">
          <h3 style="margin:0 0 16px 0;">Ihre Zugangsdaten / Your login details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;font-weight:600;">Portal:</td><td style="padding:8px 0;"><a href="${portalUrl}" style="color:#1e3a5f;">${portalUrl}</a></td></tr>
            ${row("E-Mail:", clientEmail)}
            ${row("Passwort / Password:", password)}
          </table>
        </div>
        <div style="text-align:center;margin:30px 0;">
          <a href="${portalUrl}" style="background:#1e3a5f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Zum Portal / Go to portal →</a>
        </div>
        <p style="color:#666;font-size:14px;line-height:1.6;">Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.<br/>Please change your password after your first login.</p>
        <hr style="border:none;border-top:1px solid #e9ecef;margin:30px 0;" />
        <p style="color:#999;font-size:12px;">Gesendet von / Sent by ${senderName || "Media Marketing"}. Falls Sie diese E-Mail nicht erwartet haben, ignorieren Sie sie bitte. / If you did not expect this email, please ignore it.</p>
      </div>
    `;

    // Send to client
    const clientRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "Media Marketing <noreply@mediaamarketing.com>",
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
          <li><strong>Portal Login:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
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
            from: "Media Marketing <noreply@mediaamarketing.com>",
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
