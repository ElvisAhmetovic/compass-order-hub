import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_ABMEDIA");

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

const germanMonths = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(amount);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY_ABMEDIA not configured");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Thomas Klein <noreply@abm-team.com>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

async function sendClientInvoiceEmail(
  clientEmail: string,
  clientName: string,
  monthLabel: string,
  amount: number,
  currency: string,
  website: string | null,
): Promise<boolean> {
  const formattedPrice = formatPrice(amount, currency);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Monatliche Rechnung – ${monthLabel}</h2>
      <p>Hallo ${clientName},</p>
      <p>hiermit erhalten Sie Ihre monatliche Rechnung für <strong>${monthLabel}</strong>.</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Kunde:</td><td style="padding: 8px 0; font-weight: bold;">${clientName}</td></tr>
          ${website ? `<tr><td style="padding: 8px 0; color: #666;">Website:</td><td style="padding: 8px 0;">${website}</td></tr>` : ""}
          <tr><td style="padding: 8px 0; color: #666;">Zeitraum:</td><td style="padding: 8px 0; font-weight: bold;">${monthLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Betrag:</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #2563eb;">${formattedPrice}</td></tr>
        </table>
      </div>
      <p>Bitte veranlassen Sie die Zahlung zeitnah.</p>
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      <br/><p>Mit freundlichen Grüßen,<br/><strong>AB Media Team</strong></p>
    </div>`;
  return sendEmail([clientEmail], `Monatliche Rechnung – ${monthLabel} – ${formattedPrice}`, html);
}

async function sendTeamNotification(
  clientName: string,
  monthLabel: string,
  amount: number,
  currency: string,
): Promise<number> {
  const formattedPrice = formatPrice(amount, currency);
  const subject = `Monthly payment reminder sent – ${clientName} – ${monthLabel}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Monthly Payment Reminder Sent</h2>
      <p>A monthly payment reminder has been sent to the following client:</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Company:</td><td style="padding: 8px 0; font-weight: bold;">${clientName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Period:</td><td style="padding: 8px 0; font-weight: bold;">${monthLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Amount:</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #2563eb;">${formattedPrice}</td></tr>
        </table>
      </div>
      <p style="color: #666; font-size: 14px;">This is an automated notification from the Monthly Packages system.</p>
    </div>`;

  let sent = 0;
  for (const email of TEAM_EMAILS) {
    const ok = await sendEmail([email], subject, html);
    if (ok) sent++;
    await delay(500);
  }
  return sent;
}

async function createTeamNotifications(
  supabase: any,
  clientName: string,
  monthLabel: string,
  amount: number,
  currency: string,
) {
  const formattedPrice = formatPrice(amount, currency);
  // Get all non-client user IDs
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .neq("role", "client");

  if (!profiles || profiles.length === 0) return;

  const notifications = profiles.map((p: any) => ({
    user_id: p.id,
    title: "Monthly Payment Reminder Sent",
    message: `Payment reminder sent to ${clientName} for ${monthLabel} — ${formattedPrice}`,
    type: "payment_reminder",
  }));

  await supabase.from("notifications").insert(notifications);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthLabel = `${germanMonths[currentMonth]} ${currentYear}`;

    console.log(`Processing monthly installments for ${monthLabel}`);

    const { data: contracts, error: contractsError } = await supabase
      .from("monthly_contracts")
      .select("*")
      .eq("status", "active");

    if (contractsError) throw new Error(`Error fetching contracts: ${contractsError.message}`);

    if (!contracts || contracts.length === 0) {
      console.log("No active contracts found");
      return new Response(JSON.stringify({ message: "No active contracts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let emailsSent = 0;
    let teamEmailsSent = 0;

    for (const contract of contracts) {
      const { data: existing } = await supabase
        .from("monthly_installments")
        .select("id")
        .eq("contract_id", contract.id)
        .eq("month_label", monthLabel)
        .maybeSingle();

      if (existing) {
        const { data: installment } = await supabase
          .from("monthly_installments")
          .select("*")
          .eq("id", existing.id)
          .single();

        if (installment && !installment.email_sent) {
          const sent = await sendClientInvoiceEmail(
            installment.client_email, installment.client_name, monthLabel,
            installment.amount, installment.currency, installment.website,
          );
          if (sent) {
            await supabase.from("monthly_installments")
              .update({ email_sent: true, email_sent_at: new Date().toISOString() })
              .eq("id", existing.id);
            emailsSent++;

            // Send team notification
            const teamSent = await sendTeamNotification(
              installment.client_name, monthLabel, installment.amount, installment.currency,
            );
            teamEmailsSent += teamSent;
            await createTeamNotifications(
              supabase, installment.client_name, monthLabel, installment.amount, installment.currency,
            );
          }
        }
        continue;
      }

      // Calculate month number within contract
      const startDate = new Date(contract.start_date);
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();
      const monthNumber = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;

      if (monthNumber < 1 || monthNumber > contract.duration_months) {
        if (monthNumber > contract.duration_months) {
          await supabase.from("monthly_contracts").update({ status: "completed" }).eq("id", contract.id);
        }
        continue;
      }

      const dueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
      const { data: newInstallment, error: insertError } = await supabase
        .from("monthly_installments")
        .insert({
          contract_id: contract.id,
          month_label: monthLabel,
          month_number: monthNumber,
          due_date: dueDate,
          amount: contract.monthly_amount,
          currency: contract.currency,
          payment_status: "unpaid",
          client_name: contract.client_name,
          client_email: contract.client_email,
          website: contract.website,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Error creating installment for contract ${contract.id}:`, insertError);
        continue;
      }

      processed++;

      const sent = await sendClientInvoiceEmail(
        contract.client_email, contract.client_name, monthLabel,
        contract.monthly_amount, contract.currency, contract.website,
      );

      if (sent && newInstallment) {
        await supabase.from("monthly_installments")
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq("id", newInstallment.id);
        emailsSent++;

        // Send team notification
        const teamSent = await sendTeamNotification(
          contract.client_name, monthLabel, contract.monthly_amount, contract.currency,
        );
        teamEmailsSent += teamSent;
        await createTeamNotifications(
          supabase, contract.client_name, monthLabel, contract.monthly_amount, contract.currency,
        );
      }
    }

    console.log(`Processed ${processed} installments, sent ${emailsSent} client emails, ${teamEmailsSent} team emails`);

    return new Response(
      JSON.stringify({ success: true, processed, emailsSent, teamEmailsSent, month: monthLabel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-monthly-installments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
