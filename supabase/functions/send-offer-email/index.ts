import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const formatPrice = (price: number, currency: string) => {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const buildOfferEmailHtml = (data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  companyName: string;
  description: string;
  price: number;
  currency: string;
  senderName: string;
}) => {
  const formattedPrice = formatPrice(data.price, data.currency);
  const initial = (data.clientName || 'C').charAt(0).toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Your Offer from AB Media Team</title></head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background-color:#ffffff;">
        <!-- Header -->
        <tr><td style="padding:22px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td align="left" style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#606368;">Service Offer</td>
            <td align="right" style="font-family:Roboto,Arial,sans-serif; font-size:18px; font-weight:bold; color:#1a73e8;">AB Media Team</td>
          </tr></table>
        </td></tr>

        <!-- Stars -->
        <tr><td style="text-align:center; padding:32px 24px 0px;">
          <div style="font-size:48px; color:#fbbc05; letter-spacing:8px; line-height:1;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        </td></tr>

        <!-- Illustration -->
        <tr><td style="text-align:center; padding:8px 24px 0px;">
          <img src="https://www.gstatic.com/gumdrop/files/gmb-migration-transparent-w726-h298-2x.png" width="363" height="auto" border="0" alt="" style="display:inline-block; max-width:363px; width:100%;">
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:16px 32px 24px; text-align:center;">
          <h1 style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:28px; color:#606368; font-weight:normal; line-height:1.3;">You have received an offer from AB Media Team</h1>
        </td></tr>

        <!-- Client Info Card -->
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa; border:1px solid #dadce0; border-radius:12px; padding:24px;">
            <tr>
              <td style="vertical-align:top; width:56px;">
                <div style="width:40px; height:40px; background-color:#1a73e8; color:#ffffff; border-radius:50%; font-size:20px; font-weight:bold; line-height:40px; text-align:center;">${initial}</div>
              </td>
              <td style="padding-left:16px; vertical-align:top;">
                <div style="font-weight:bold; color:#202124; font-size:16px;">${data.clientName}</div>
                <div style="color:#5f6368; font-size:13px; margin-top:4px;">📧 ${data.clientEmail}</div>
                ${data.clientPhone ? `<div style="color:#5f6368; font-size:13px; margin-top:2px;">📞 ${data.clientPhone}</div>` : ''}
                ${data.clientAddress ? `<div style="color:#5f6368; font-size:13px; margin-top:2px;">📍 ${data.clientAddress}</div>` : ''}
                <div style="color:#1a73e8; font-size:18px; font-weight:bold; margin-top:8px;">Price: ${formattedPrice}</div>
                ${data.description ? `<div style="color:#5f6368; font-size:13px; line-height:1.6; margin-top:8px;">${data.description.replace(/\n/g, '<br>')}</div>` : ''}
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Confirm button -->
        <tr><td style="text-align:center; padding:16px 32px 32px;">
          <a href="https://compass-order-hub.lovable.app" style="display:inline-block; height:48px; padding:0 28px; border-radius:8px; background:#1a73e8; color:#ffffff; font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; line-height:48px; text-decoration:none; white-space:nowrap; box-shadow:0 1px 2px rgba(60,64,67,.15),0 2px 6px rgba(60,64,67,.10);">Confirm Your Order</a>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:0 32px 8px; font-family:Roboto,Arial,sans-serif; font-size:14px; color:#606368; line-height:1.7; text-align:center;">
          Dear ${data.clientName},
        </td></tr>

        <!-- Body text -->
        <tr><td style="padding:8px 32px 16px; font-family:Roboto,Arial,sans-serif; font-size:14px; color:#606368; line-height:1.7; text-align:center;">
          We are pleased to present you with this offer for our professional services. Please review the details above and click "Confirm Your Order" to proceed.<br><br>
          If you have any questions, feel free to reach out to us directly.
        </td></tr>

        <!-- Trust text -->
        <tr><td style="padding:0 32px 16px; font-family:Roboto,Arial,sans-serif; font-size:12px; color:#9aa0a6; line-height:1.6; text-align:center;">
          Fast response, clear steps, professional documentation – your satisfaction is our priority.
        </td></tr>

        <!-- WhatsApp circle button -->
        <tr><td style="text-align:center; padding:0 32px 40px;">
          <a href="https://api.whatsapp.com/send/?phone=4920370907262&text=Hello+AB+Media+Team%2C+I+would+like+to+inquire+about+your+services.&type=phone_number&app_absent=0" style="display:inline-block; width:52px; height:52px; border-radius:50%; background:#25D366; color:#ffffff; font-size:26px; line-height:52px; text-align:center; text-decoration:none; box-shadow:0 1px 2px rgba(60,64,67,.15),0 2px 6px rgba(60,64,67,.10);">&#128172;</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#dadce0; padding:32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="font-family:Roboto,Arial,sans-serif; font-size:10px; color:#515354; line-height:16px;">
              Best regards,<br>
              ${data.senderName}, AB Media Team<br><br>
              <a href="https://abmedia-team.com" style="color:#1967d2; text-decoration:none;">abmedia-team.com</a>
            </td>
            <td align="right" style="padding-left:20px; vertical-align:top;">
              <div style="font-family:Roboto,Arial,sans-serif; font-size:14px; font-weight:bold; color:#1a73e8;">AB Media Team</div>
              <div style="font-family:Roboto,Arial,sans-serif; font-size:10px; color:#515354; margin-top:6px;">&copy; ${new Date().getFullYear()} AB Media Team</div>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY_ABMEDIA');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY_ABMEDIA is not configured');
    }

    const body = await req.json();
    const { clientEmail, clientName, clientPhone, clientAddress, companyName, description, price, currency, senderName } = body;

    if (!clientEmail || !clientName || !companyName) {
      throw new Error('Missing required fields: clientEmail, clientName, companyName');
    }

    const html = buildOfferEmailHtml({
      clientName,
      clientEmail,
      clientPhone: clientPhone || '',
      clientAddress: clientAddress || '',
      companyName,
      description: description || '',
      price: price || 0,
      currency: currency || 'EUR',
      senderName: senderName || 'AB Media Team',
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AB Media Team <noreply@abm-team.com>',
        to: [clientEmail],
        subject: `Your Offer from AB Media Team – ${companyName}`,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('Offer email sent successfully to:', clientEmail);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in send-offer-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
