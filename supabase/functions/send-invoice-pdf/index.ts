import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NOTIFICATION_EMAIL_LIST = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'kleinabmedia@gmail.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com',
  'ajosesales36@gmail.com',
  'georgabmediateam@gmail.com',
  'jannes@scoolfinanceedu.com',
  'johan@team-abmedia.com',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_email, subject, message, pdf_base64, invoice_number } = await req.json();

    if (!client_email || !pdf_base64 || !invoice_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: client_email, pdf_base64, invoice_number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY_ABMEDIA');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY_ABMEDIA is not configured');
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Invoice ${invoice_number}</h2>
        ${message ? `<div style="margin: 20px 0; white-space: pre-wrap;">${message}</div>` : ''}
        <p style="color: #666; margin-top: 20px;">Please find the invoice PDF attached to this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">AB Media Team</p>
      </div>
    `;

    // Extract raw base64 data (remove data URI prefix if present)
    const base64Data = pdf_base64.includes(',') ? pdf_base64.split(',')[1] : pdf_base64;

    // Send to client
    const clientRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AB Media Team <noreply@abm-team.com>',
        to: [client_email],
        subject: subject || `Invoice ${invoice_number} from AB Media Team`,
        html: htmlBody,
        attachments: [
          {
            filename: `invoice-${invoice_number}.pdf`,
            content: base64Data,
          },
        ],
      }),
    });

    if (!clientRes.ok) {
      const errorText = await clientRes.text();
      console.error('Resend error (client):', errorText);
      throw new Error(`Failed to send email to client: ${errorText}`);
    }

    await clientRes.json();

    // Notify team (without attachment, just a notification)
    const teamHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Invoice Sent: ${invoice_number}</h2>
        <p>Invoice <strong>${invoice_number}</strong> has been sent to <strong>${client_email}</strong>.</p>
        ${message ? `<p><strong>Message included:</strong></p><div style="background: #f5f5f5; padding: 12px; border-radius: 4px; white-space: pre-wrap;">${message}</div>` : ''}
      </div>
    `;

    for (const email of NOTIFICATION_EMAIL_LIST) {
      try {
        const teamRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'AB Media Team <noreply@abm-team.com>',
            to: [email],
            subject: `[Team] Invoice ${invoice_number} sent to ${client_email}`,
            html: teamHtml,
          }),
        });
        if (!teamRes.ok) {
          const errText = await teamRes.text();
          console.error(`Failed to notify ${email}:`, errText);
        } else {
          await teamRes.json();
        }
        // 500ms delay between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.error(`Error notifying ${email}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Invoice sent to ${client_email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-invoice-pdf:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
