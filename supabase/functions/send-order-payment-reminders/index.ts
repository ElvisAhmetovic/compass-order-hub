import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Team emails to receive payment reminders
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
];

const APP_URL = Deno.env.get("APP_URL") || "https://www.empriadental.de";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting payment reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Find all due reminders (scheduled and remind_at <= now)
    const now = new Date().toISOString();
    const { data: dueReminders, error: fetchError } = await supabase
      .from("payment_reminders")
      .select(`
        *,
        orders (
          id,
          company_name,
          company_address,
          contact_email,
          contact_phone,
          price,
          currency,
          description,
          internal_notes,
          inventory_items
        )
      `)
      .eq("status", "scheduled")
      .lte("remind_at", now);

    if (fetchError) {
      console.error("Error fetching due reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No due reminders", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const reminder of dueReminders) {
      try {
        const order = reminder.orders;
        if (!order) {
          console.log(`Skipping reminder ${reminder.id} - no order found`);
          continue;
        }

        const orderLink = `${APP_URL}/dashboard?orderId=${order.id}`;
        const price = order.price ? `€${Number(order.price).toLocaleString()}` : "Not specified";

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .order-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb; }
              .order-details h3 { margin: 0 0 10px 0; color: #1f2937; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
              .detail-label { color: #6b7280; }
              .detail-value { color: #1f2937; font-weight: 500; }
              .note-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
              .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Payment Reminder</h1>
                <p style="margin: 0; opacity: 0.9;">Time to follow up on this payment</p>
              </div>
              <div class="content">
                <p>This is a scheduled reminder to follow up on a payment from:</p>
                
                <div class="order-details">
                  <h3>${order.company_name}</h3>
                  <div class="detail-row">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value">${price}</span>
                  </div>
                  ${order.contact_email ? `
                  <div class="detail-row">
                    <span class="detail-label">Contact Email</span>
                    <span class="detail-value">${order.contact_email}</span>
                  </div>
                  ` : ""}
                  ${order.contact_phone ? `
                  <div class="detail-row">
                    <span class="detail-label">Contact Phone</span>
                    <span class="detail-value">${order.contact_phone}</span>
                  </div>
                  ` : ""}
                  ${order.company_address ? `
                  <div class="detail-row">
                    <span class="detail-label">Address</span>
                    <span class="detail-value">${order.company_address}</span>
                  </div>
                  ` : ""}
                  ${order.description ? `
                  <div class="detail-row">
                    <span class="detail-label">Package</span>
                    <span class="detail-value">${order.description}</span>
                  </div>
                  ` : ""}
                </div>

                ${reminder.note ? `
                <div class="note-box">
                  <strong>📝 Reminder Note:</strong><br>
                  ${reminder.note}
                </div>
                ` : ""}

                <p>Scheduled by: <strong>${reminder.created_by_name || "Team member"}</strong></p>

                <center>
                  <a href="${orderLink}" class="button">View Order Details</a>
                </center>
              </div>
              <div class="footer">
                <p>This is an automated payment reminder from EMPRIA Dental CRM</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email to all team members
        const emailResponse = await resend.emails.send({
          from: "EMPRIA Dental <noreply@empriadental.de>",
          to: TEAM_EMAILS,
          subject: `💰 Payment Reminder: ${order.company_name} - ${price}`,
          html: emailHtml,
        });

        console.log(`Email sent for reminder ${reminder.id}:`, emailResponse);

        // Update reminder status to sent
        const { error: updateError } = await supabase
          .from("payment_reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
        } else {
          processedCount++;
        }
      } catch (reminderError) {
        console.error(`Error processing reminder ${reminder.id}:`, reminderError);
        errorCount++;
      }
    }

    console.log(`Processed ${processedCount} reminders, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        message: "Payment reminders processed",
        processed: processedCount,
        errors: errorCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-order-payment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
