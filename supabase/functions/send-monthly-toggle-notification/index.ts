import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NOTIFICATION_EMAIL_LIST = [
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RequestBody {
  clientName: string;
  clientEmail: string;
  monthLabel: string;
  amount: number;
  currency: string;
  toggleType: "paid" | "invoice_sent";
  newValue: boolean;
  changedBy: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { clientName, clientEmail, monthLabel, amount, currency, toggleType, newValue, changedBy } = body;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_ABMEDIA");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY_ABMEDIA not configured");
    }

    const formattedAmount = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);

    const toggleLabel =
      toggleType === "paid"
        ? newValue ? "Payment marked as Paid ✅" : "Payment marked as Unpaid ❌"
        : newValue ? "Invoice marked as Sent ✅" : "Invoice marked as Not Sent ❌";

    const subject = `[Monthly] ${toggleLabel} — ${clientName} — ${monthLabel}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Monthly Package Update</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="background: ${toggleType === "paid" ? (newValue ? "#ecfdf5" : "#fef2f2") : (newValue ? "#eff6ff" : "#fef2f2")}; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="font-size: 18px; font-weight: bold; margin: 0; color: ${toggleType === "paid" ? (newValue ? "#059669" : "#dc2626") : (newValue ? "#2563eb" : "#dc2626")};">
              ${toggleLabel}
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Client:</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; font-size: 14px;">${clientEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Month:</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${monthLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Changed by:</td>
              <td style="padding: 8px 0; font-size: 14px;">${changedBy}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            AB Media Team — Monthly Package Notifications
          </p>
        </div>
      </div>
    `;

    const results: string[] = [];

    for (let i = 0; i < NOTIFICATION_EMAIL_LIST.length; i++) {
      const email = NOTIFICATION_EMAIL_LIST[i];
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "AB Media Team <noreply@abm-team.com>",
            to: [email],
            subject,
            html,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          results.push(`❌ ${email}: ${err}`);
        } else {
          results.push(`✅ ${email}`);
        }
      } catch (e) {
        results.push(`❌ ${email}: ${e.message}`);
      }
      if (i < NOTIFICATION_EMAIL_LIST.length - 1) {
        await sleep(1500);
      }
    }

    console.log("Monthly toggle notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-monthly-toggle-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
