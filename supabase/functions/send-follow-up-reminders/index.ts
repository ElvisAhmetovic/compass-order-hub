import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NOTIFICATION_EMAIL_LIST = [
  "angelina@abmedia-team.com",
  "service@team-abmedia.com",
  "thomas.thomasklein@gmail.com",
  "invoice@team-abmedia.com",
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting follow-up reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY_ABMEDIA");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY_ABMEDIA is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const now = new Date().toISOString();
    const { data: dueReminders, error: fetchError } = await supabase
      .from("follow_up_reminders")
      .select("*")
      .eq("status", "scheduled")
      .lte("remind_at", now)
      .limit(50);

    if (fetchError) {
      console.error("Error fetching due follow-up reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueReminders?.length || 0} due follow-up reminders`);

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No due follow-up reminders", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const reminder of dueReminders) {
      try {
        // Fetch any attachments for this reminder
        const { data: attachments } = await supabase
          .from("file_attachments")
          .select("file_name, file_url")
          .eq("reminder_id", reminder.id);

        const phoneLink = reminder.contact_phone
          ? `<a href="tel:${reminder.contact_phone.replace(/\s/g, '')}" style="color: #2563eb; font-weight: bold; font-size: 18px; text-decoration: none;">📞 ${reminder.contact_phone}</a>`
          : "";

        const phoneRow = reminder.contact_phone
          ? `<div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">CALL NOW</p>
              ${phoneLink}
            </div>`
          : "";

        const noteHtml = reminder.note
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');

        let attachmentsHtml = "";
        if (attachments && attachments.length > 0) {
          const links = attachments
            .map(a => `<li><a href="${a.file_url}" style="color: #2563eb;">${a.file_name}</a></li>`)
            .join("");
          attachmentsHtml = `
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb;">
              <strong>📎 Attachments:</strong>
              <ul style="margin: 5px 0 0 0; padding-left: 20px;">${links}</ul>
            </div>`;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">📞 Follow-Up Reminder</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Time to make this call</p>
              </div>
              <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 0 0 15px 0; border: 1px solid #e5e7eb;">
                  <h2 style="margin: 0 0 5px 0; color: #1f2937; font-size: 20px;">${reminder.company_name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
                </div>

                ${phoneRow}

                <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #eab308;">
                  <strong>📝 Notes:</strong><br>
                  <span style="color: #374151;">${noteHtml}</span>
                </div>

                ${attachmentsHtml}

                <p style="color: #6b7280; font-size: 13px; margin: 20px 0 0 0;">
                  Created by: <strong>${(reminder.created_by_name || 'Team member').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>
                </p>
              </div>
              <div style="text-align: center; color: #9ca3af; font-size: 11px; padding: 15px;">
                <p style="margin: 0;">Automated follow-up reminder from AB Media Team CRM</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const subject = `📞 Follow-Up: ${reminder.company_name}${reminder.contact_phone ? ` - ${reminder.contact_phone}` : ''} (Assigned: ${reminder.assignee_name || reminder.assignee_email})`;

        for (let i = 0; i < NOTIFICATION_EMAIL_LIST.length; i += 2) {
          const batch = NOTIFICATION_EMAIL_LIST.slice(i, i + 2);
          for (const email of batch) {
            await resend.emails.send({
              from: "AB Media Team <noreply@abm-team.com>",
              to: [email],
              subject,
              html: emailHtml,
            });
          }
          if (i + 2 < NOTIFICATION_EMAIL_LIST.length) {
            await sleep(1000);
          }
        }

        console.log(`Email sent to ${reminder.assignee_email} for reminder ${reminder.id}`);

        const { error: updateError } = await supabase
          .from("follow_up_reminders")
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
        console.error(`Error processing follow-up reminder ${reminder.id}:`, reminderError);
        
        await supabase
          .from("follow_up_reminders")
          .update({ status: "failed" })
          .eq("id", reminder.id);

        errorCount++;
      }
    }

    console.log(`Processed ${processedCount} follow-up reminders, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ message: "Follow-up reminders processed", processed: processedCount, errors: errorCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-follow-up-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
