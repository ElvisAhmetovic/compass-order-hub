
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log(`Received ${req.method} request to send-order-confirmation`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('RESEND_API_KEY exists:', !!resendApiKey);
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured - RESEND_API_KEY missing" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Initialize Resend with the API key
    const resend = new Resend(resendApiKey);

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const { orderData, emails, assignedToName, selectedInventoryItems } = requestBody;
    
    console.log('Received order confirmation request:', {
      orderData: orderData?.company_name,
      emails: emails?.length,
      assignedToName,
      inventoryItems: selectedInventoryItems?.length
    });

    if (!orderData || !emails || emails.length === 0) {
      console.error('Missing required data for order confirmation');
      return new Response(
        JSON.stringify({ error: 'Missing order data or email addresses' }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Helper functions
    const formatCurrency = (amount: number, currency: string) => {
      const symbols = { EUR: '€', USD: '$', GBP: '£' };
      return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatInventoryItems = (items: any[]) => {
      if (!items || items.length === 0) return '';
      
      return items.map(item => 
        `<li style="margin-bottom: 8px;">
          <strong>${item.name}</strong> - ${item.quantity} ${item.unit || 'Stück'}
          ${item.description ? `<br><span style="color: #666; font-size: 14px;">${item.description}</span>` : ''}
        </li>`
      ).join('');
    };

    const emailSubject = `Neue Bestellung erhalten - ${orderData.company_name}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bestellbestätigung</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 24px;">Empria Dental</h1>
          <h2 style="color: #1f2937; margin: 0; font-size: 20px;">Neue Bestellung erhalten</h2>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Kundeninformationen</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Unternehmen:</td>
              <td style="padding: 8px 0;">${orderData.company_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">E-Mail:</td>
              <td style="padding: 8px 0;">${orderData.contact_email}</td>
            </tr>
            ${orderData.contact_phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Telefon:</td>
              <td style="padding: 8px 0;">${orderData.contact_phone}</td>
            </tr>` : ''}
            ${orderData.company_address ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Adresse:</td>
              <td style="padding: 8px 0;">${orderData.company_address}</td>
            </tr>` : ''}
            ${orderData.company_link ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Website:</td>
              <td style="padding: 8px 0;"><a href="${orderData.company_link}" target="_blank" style="color: #2563eb;">${orderData.company_link}</a></td>
            </tr>` : ''}
          </table>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Bestelldetails</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Betrag:</td>
              <td style="padding: 8px 0; font-size: 18px; color: #059669; font-weight: bold;">${formatCurrency(orderData.price, orderData.currency)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Priorität:</td>
              <td style="padding: 8px 0;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                  ${orderData.priority === 'urgent' ? 'background-color: #fef2f2; color: #dc2626;' : 
                    orderData.priority === 'high' ? 'background-color: #fff7ed; color: #ea580c;' : 
                    orderData.priority === 'medium' ? 'background-color: #fefce8; color: #ca8a04;' : 
                    'background-color: #f0f9ff; color: #0284c7;'}">
                  ${orderData.priority.charAt(0).toUpperCase() + orderData.priority.slice(1)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Status:</td>
              <td style="padding: 8px 0;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: #f0f9ff; color: #0284c7;">
                  ${orderData.status}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Zugewiesen an:</td>
              <td style="padding: 8px 0;">${assignedToName || 'Nicht zugewiesen'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Erstellt am:</td>
              <td style="padding: 8px 0;">${formatDate(orderData.created_at)}</td>
            </tr>
          </table>
        </div>

        ${selectedInventoryItems && selectedInventoryItems.length > 0 ? `
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Inventar-Artikel</h3>
          <ul style="padding-left: 20px; margin: 0;">
            ${formatInventoryItems(selectedInventoryItems)}
          </ul>
        </div>` : ''}

        ${orderData.description ? `
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Beschreibung</h3>
          <p style="margin: 0; white-space: pre-wrap;">${orderData.description}</p>
        </div>` : ''}

        ${orderData.internal_notes ? `
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #f59e0b; margin-bottom: 20px;">
          <h3 style="color: #92400e; margin-top: 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Interne Notizen</h3>
          <p style="margin: 0; white-space: pre-wrap; color: #92400e;">${orderData.internal_notes}</p>
        </div>` : ''}

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Diese E-Mail wurde automatisch von Empria Dental generiert.<br>
            Besuchen Sie uns unter: <a href="https://empriadental.de" style="color: #2563eb;">empriadental.de</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const results = [];
    
    // Send email to each recipient
    for (const email of emails) {
      try {
        console.log(`Attempting to send order confirmation to: ${email}`);
        
        const emailResponse = await resend.emails.send({
          from: "Empria Dental <noreply@empriadental.de>",
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Email sent successfully to ${email}:`, emailResponse);
        results.push({ email, success: true, id: emailResponse.data?.id });
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    console.log(`Email sending completed. Results:`, results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Order confirmation emails sent to ${emails.length} recipient(s)` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
