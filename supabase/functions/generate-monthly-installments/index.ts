import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_ABMEDIA");

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

async function sendInvoiceEmail(
  clientEmail: string,
  clientName: string,
  monthLabel: string,
  amount: number,
  currency: string,
  website: string | null,
) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY_ABMEDIA not configured");
    return false;
  }

  const formattedPrice = formatPrice(amount, currency);

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Monatliche Rechnung – ${monthLabel}</h2>
      <p>Hallo ${clientName},</p>
      <p>hiermit erhalten Sie Ihre monatliche Rechnung für <strong>${monthLabel}</strong>.</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Kunde:</td>
            <td style="padding: 8px 0; font-weight: bold;">${clientName}</td>
          </tr>
          ${website ? `<tr><td style="padding: 8px 0; color: #666;">Website:</td><td style="padding: 8px 0;">${website}</td></tr>` : ""}
          <tr>
            <td style="padding: 8px 0; color: #666;">Zeitraum:</td>
            <td style="padding: 8px 0; font-weight: bold;">${monthLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Betrag:</td>
            <td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #2563eb;">${formattedPrice}</td>
          </tr>
        </table>
      </div>
      <p>Bitte veranlassen Sie die Zahlung zeitnah.</p>
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      <br/>
      <p>Mit freundlichen Grüßen,<br/><strong>AB Media Team</strong></p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Thomas Klein <noreply@abm-team.com>",
        to: [clientEmail],
        subject: `Monatliche Rechnung – ${monthLabel} – ${formattedPrice}`,
        html: emailBody,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend error:", errorText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
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
    const currentMonth = now.getMonth(); // 0-indexed
    const currentYear = now.getFullYear();
    const monthLabel = `${germanMonths[currentMonth]} ${currentYear}`;

    console.log(`Processing monthly installments for ${monthLabel}`);

    // Get all active contracts
    const { data: contracts, error: contractsError } = await supabase
      .from("monthly_contracts")
      .select("*")
      .eq("status", "active");

    if (contractsError) {
      throw new Error(`Error fetching contracts: ${contractsError.message}`);
    }

    if (!contracts || contracts.length === 0) {
      console.log("No active contracts found");
      return new Response(JSON.stringify({ message: "No active contracts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let emailsSent = 0;

    for (const contract of contracts) {
      // Check if installment for current month already exists
      const { data: existing } = await supabase
        .from("monthly_installments")
        .select("id")
        .eq("contract_id", contract.id)
        .eq("month_label", monthLabel)
        .maybeSingle();

      if (existing) {
        // Check if email needs to be sent for existing installment
        const { data: installment } = await supabase
          .from("monthly_installments")
          .select("*")
          .eq("id", existing.id)
          .single();

        if (installment && !installment.email_sent) {
          const sent = await sendInvoiceEmail(
            installment.client_email,
            installment.client_name,
            monthLabel,
            installment.amount,
            installment.currency,
            installment.website,
          );
          if (sent) {
            await supabase
              .from("monthly_installments")
              .update({ email_sent: true, email_sent_at: new Date().toISOString() })
              .eq("id", existing.id);
            emailsSent++;
          }
        }
        continue;
      }

      // Calculate month number within contract
      const startDate = new Date(contract.start_date);
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();
      const monthNumber = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;

      // Skip if outside contract duration
      if (monthNumber < 1 || monthNumber > contract.duration_months) {
        // Mark contract as completed if past duration
        if (monthNumber > contract.duration_months) {
          await supabase
            .from("monthly_contracts")
            .update({ status: "completed" })
            .eq("id", contract.id);
        }
        continue;
      }

      // Create installment
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

      // Send email
      const sent = await sendInvoiceEmail(
        contract.client_email,
        contract.client_name,
        monthLabel,
        contract.monthly_amount,
        contract.currency,
        contract.website,
      );

      if (sent && newInstallment) {
        await supabase
          .from("monthly_installments")
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq("id", newInstallment.id);
        emailsSent++;
      }
    }

    console.log(`Processed ${processed} installments, sent ${emailsSent} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        emailsSent,
        month: monthLabel,
      }),
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
