import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TEAM_EMAILS = [
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
  'johan@team-abmedia.com',
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const formatPrice = (price: number, currency: string) => {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', BAM: 'BAM' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const buildContractEmailHtml = (data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalValue: number;
  currency: string;
  durationMonths: number;
  billingFrequency: number;
  installmentAmount: number;
  numberOfInstallments: number;
  startDate: string;
  assignedTo: string;
  description: string;
  priority: string;
}) => {
  const formattedTotal = formatPrice(data.totalValue, data.currency);
  const formattedInstallment = formatPrice(data.installmentAmount, data.currency);
  const initial = (data.clientName || 'C').charAt(0).toUpperCase();
  const priorityColors: Record<string, string> = {
    low: '#34a853',
    medium: '#fbbc05',
    high: '#ea4335',
    urgent: '#d93025',
  };
  const priorityColor = priorityColors[data.priority] || '#fbbc05';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Monthly Contract - AB Media Team</title></head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background-color:#ffffff;">
        <!-- Header -->
        <tr><td style="padding:22px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td align="left" style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#606368;">New Monthly Contract</td>
            <td align="right" style="font-family:Roboto,Arial,sans-serif; font-size:18px; font-weight:bold; color:#1a73e8;">AB Media Team</td>
          </tr></table>
        </td></tr>

        <!-- Icon -->
        <tr><td style="text-align:center; padding:32px 24px 8px;">
          <div style="font-size:56px; line-height:1;">📋</div>
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:16px 32px 24px; text-align:center;">
          <h1 style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:28px; color:#606368; font-weight:normal; line-height:1.3;">A new monthly contract has been created!</h1>
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
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Contract Details Card -->
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#e8f0fe; border:1px solid #c6dafc; border-radius:12px; padding:24px;">
            <tr><td>
              <div style="font-weight:bold; color:#1a73e8; font-size:16px; margin-bottom:12px;">Contract Details</div>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0; width:50%;">Total Value:</td>
                  <td style="color:#202124; font-size:13px; font-weight:bold; padding:4px 0;">${formattedTotal}</td>
                </tr>
                <tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0;">Duration:</td>
                  <td style="color:#202124; font-size:13px; font-weight:bold; padding:4px 0;">${data.durationMonths} months</td>
                </tr>
                <tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0;">Billing Frequency:</td>
                  <td style="color:#202124; font-size:13px; font-weight:bold; padding:4px 0;">Every ${data.billingFrequency} month${data.billingFrequency > 1 ? 's' : ''}</td>
                </tr>
                <tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0;">Installment Amount:</td>
                  <td style="color:#1a73e8; font-size:15px; font-weight:bold; padding:4px 0;">${formattedInstallment}</td>
                </tr>
                <tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0;">Number of Installments:</td>
                  <td style="color:#202124; font-size:13px; font-weight:bold; padding:4px 0;">${data.numberOfInstallments}</td>
                </tr>
                <tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0;">Start Date:</td>
                  <td style="color:#202124; font-size:13px; font-weight:bold; padding:4px 0;">${data.startDate}</td>
                </tr>
                <tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0;">Priority:</td>
                  <td style="padding:4px 0;"><span style="display:inline-block; padding:2px 10px; border-radius:12px; background-color:${priorityColor}; color:#ffffff; font-size:12px; font-weight:bold; text-transform:capitalize;">${data.priority}</span></td>
                </tr>
                ${data.assignedTo ? `<tr>
                  <td style="color:#5f6368; font-size:13px; padding:4px 0;">Assigned To:</td>
                  <td style="color:#202124; font-size:13px; font-weight:bold; padding:4px 0;">${data.assignedTo}</td>
                </tr>` : ''}
              </table>
              ${data.description ? `<div style="margin-top:12px; padding-top:12px; border-top:1px solid #c6dafc;">
                <div style="color:#5f6368; font-size:12px; margin-bottom:4px;">Description:</div>
                <div style="color:#202124; font-size:13px; line-height:1.5;">${data.description.replace(/\n/g, '<br>')}</div>
              </div>` : ''}
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#dadce0; padding:32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="font-family:Roboto,Arial,sans-serif; font-size:10px; color:#515354; line-height:16px;">
              Best regards,<br>
              AB Media Team<br><br>
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
    const {
      clientName, clientEmail, clientPhone,
      totalValue, currency, durationMonths, billingFrequency,
      installmentAmount, numberOfInstallments,
      startDate, assignedTo, description, priority,
    } = body;

    if (!clientName || !clientEmail) {
      throw new Error('Missing required fields: clientName, clientEmail');
    }

    const html = buildContractEmailHtml({
      clientName,
      clientEmail,
      clientPhone: clientPhone || '',
      totalValue: totalValue || 0,
      currency: currency || 'EUR',
      durationMonths: durationMonths || 12,
      billingFrequency: billingFrequency || 1,
      installmentAmount: installmentAmount || 0,
      numberOfInstallments: numberOfInstallments || 0,
      startDate: startDate || '',
      assignedTo: assignedTo || '',
      description: description || '',
      priority: priority || 'medium',
    });

    const subject = `📋 New Monthly Contract – ${clientName}`;
    let sentCount = 0;

    // Send in batches of 2 with 1s delay
    for (let i = 0; i < TEAM_EMAILS.length; i += 2) {
      const batch = TEAM_EMAILS.slice(i, i + 2);
      const promises = batch.map((email) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'AB Media Team <noreply@abm-team.com>',
            to: [email],
            subject,
            html,
          }),
        }).then(async (res) => {
          if (res.ok) {
            sentCount++;
          } else {
            const err = await res.json();
            console.error(`Failed to send to ${email}:`, err);
          }
        }).catch((err) => {
          console.error(`Error sending to ${email}:`, err);
        })
      );

      await Promise.all(promises);

      if (i + 2 < TEAM_EMAILS.length) {
        await delay(1000);
      }
    }

    console.log(`Monthly contract created notification sent to ${sentCount}/${TEAM_EMAILS.length} recipients`);

    return new Response(JSON.stringify({ success: true, sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in send-monthly-contract-created:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
