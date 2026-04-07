import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NOTIFICATION_EMAIL_LIST = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'invoice@team-abmedia.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com',
  'ajosesales36@gmail.com',
  'georgabmediateam@gmail.com',
  'jannes@scoolfinanceedu.com',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.8");
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { client_email, subject, message, pdf_base64, invoice_number } = await req.json();

    if (!client_email || !pdf_base64 || !invoice_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: client_email, pdf_base64, invoice_number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid client email address' }),
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

    // Notify team (with same PDF attachment, batched to avoid rate limits)
    const teamHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Invoice Sent: ${invoice_number}</h2>
        <p>Invoice <strong>${invoice_number}</strong> has been sent to <strong>${client_email}</strong>.</p>
        ${message ? `<p><strong>Message included:</strong></p><div style="background: #f5f5f5; padding: 12px; border-radius: 4px; white-space: pre-wrap;">${message}</div>` : ''}
        <p style="color: #666; margin-top: 20px;">The invoice PDF is attached to this email.</p>
      </div>
    `;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const BATCH_SIZE = 2;

    for (let i = 0; i < NOTIFICATION_EMAIL_LIST.length; i += BATCH_SIZE) {
      const batch = NOTIFICATION_EMAIL_LIST.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(email =>
          fetch('https://api.resend.com/emails', {
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
              attachments: [
                {
                  filename: `invoice-${invoice_number}.pdf`,
                  content: base64Data,
                },
              ],
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                const errText = await res.text();
                console.error(`Failed to notify ${email}:`, errText);
              }
            })
            .catch(e => console.error(`Error notifying ${email}:`, e))
        )
      );
      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < NOTIFICATION_EMAIL_LIST.length) {
        await delay(1000);
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
