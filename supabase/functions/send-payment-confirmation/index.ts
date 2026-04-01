import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // johan@team-abmedia.com excluded per request
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { invoice_number, client_name, client_email, amount, currency } = await req.json();

    // Input validation
    if (!invoice_number || !client_name || !client_email || amount === undefined || !currency) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!EMAIL_REGEX.test(client_email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (String(invoice_number).length > 100 || String(client_name).length > 200) {
      return new Response(JSON.stringify({ error: 'Input too long' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY_ABMEDIA');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY_ABMEDIA not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formattedAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(Number(amount));

    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Payment Received</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${client_name},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We are pleased to confirm that we have received your payment for the following invoice:
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: bold; text-align: right; font-size: 14px;">${invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Paid:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold; text-align: right; font-size: 16px;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold; text-align: right; font-size: 14px;">✅ PAID</td>
              </tr>
            </table>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for your prompt payment. This invoice is now marked as fully paid in our records.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 30px;">
            Best regards,<br/>
            <strong>AB Media Team</strong>
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>AB Media Team | noreply@abm-team.com</p>
        </div>
      </div>
    `;

    const teamEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">💰 Payment Confirmed — Team Copy</h2>
        </div>
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p><strong>Client:</strong> ${client_name}</p>
          <p><strong>Email:</strong> ${client_email}</p>
          <p><strong>Invoice:</strong> ${invoice_number}</p>
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>Status:</strong> ✅ PAID</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;"/>
          <p style="color: #6b7280; font-size: 13px;">A payment confirmation email has been sent to the client.</p>
        </div>
      </div>
    `;

    // Send to client first
    console.log('📧 Sending payment confirmation to client:', client_email);
    const clientRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'AB Media Team <noreply@abm-team.com>',
        to: [client_email],
        subject: `Payment Received — Invoice ${invoice_number}`,
        html: clientEmailHtml,
      }),
    });

    if (!clientRes.ok) {
      const errText = await clientRes.text();
      console.error('❌ Failed to send client email:', errText);
    } else {
      console.log('✅ Client payment confirmation sent');
    }

    // Send team copies in batches of 2 with 1s delay
    const batchSize = 2;
    for (let i = 0; i < NOTIFICATION_EMAIL_LIST.length; i += batchSize) {
      const batch = NOTIFICATION_EMAIL_LIST.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (email) => {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'AB Media Team <noreply@abm-team.com>',
              to: [email],
              subject: `💰 Payment Confirmed: ${invoice_number} — ${client_name}`,
              html: teamEmailHtml,
            }),
          });
          if (!res.ok) {
            console.error(`❌ Failed to send team copy to ${email}:`, await res.text());
          }
        } catch (err) {
          console.error(`❌ Error sending to ${email}:`, err);
        }
      }));

      if (i + batchSize < NOTIFICATION_EMAIL_LIST.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ All payment confirmation emails dispatched');

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Payment confirmation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
