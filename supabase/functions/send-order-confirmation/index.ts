
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-content-type-options, x-frame-options, x-xss-protection, prefer, accept, accept-profile, content-profile",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const handler = async (req: Request): Promise<Response> => {
  console.log(`Received ${req.method} request to send-order-confirmation`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests for the actual functionality
  if (req.method !== "POST") {
    console.log(`Method ${req.method} not allowed`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
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
      console.log('Raw request body received, length:', bodyText.length);
      
      if (!bodyText.trim()) {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Successfully parsed request body');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body or empty body' }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const { orderData, emails, assignedToName, selectedInventoryItems } = requestBody;
    
    console.log('Processing order confirmation request:', {
      hasOrderData: !!orderData,
      companyName: orderData?.company_name,
      emailCount: emails?.length || 0,
      assignedToName,
      inventoryItemsCount: selectedInventoryItems?.length || 0
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

    const getPriorityBadgeStyle = (priority: string) => {
      const priorityStyles = {
        "low": "background-color: #3b82f6; color: white;",
        "medium": "background-color: #f59e0b; color: white;", 
        "high": "background-color: #ef4444; color: white;",
        "urgent": "background-color: #dc2626; color: white;",
      };
      return priorityStyles[priority.toLowerCase()] || "background-color: #6b7280; color: white;";
    };

    const isUpdate = orderData.isUpdate;
    const emailSubject = isUpdate ? 
      `Order Update - ${orderData.company_name}` : 
      `New Order Received - ${orderData.company_name}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isUpdate ? 'Order Update' : 'Order Confirmation'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background-color: ${isUpdate ? '#059669' : '#2563eb'}; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">Empria Dental</h1>
          <h2 style="margin: 0; font-size: 22px; font-weight: normal;">${isUpdate ? '📝 Order Update' : 'New Order Received'}</h2>
        </div>

        ${isUpdate ? `
        <!-- Update Notice -->
        <div style="background-color: #d1fae5; color: #065f46; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #10b981;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 10px;">📝</span>
            <div>
              <strong style="font-size: 16px;">Order Updated</strong>
              <p style="margin: 5px 0 0 0; font-size: 14px;">This order has been updated. Please review the current details below.</p>
            </div>
          </div>
        </div>` : ''}

        <!-- Order Header with Company Name and Status -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 24px; color: #1f2937;">${orderData.company_name}</h2>
            <div style="display: flex; gap: 10px;">
              <span style="padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: #dbeafe; color: #1e40af;">
                ${orderData.status || 'Created'}
              </span>
              <span style="padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; ${getPriorityBadgeStyle(orderData.priority || 'medium')}">
                ${(orderData.priority || 'medium').charAt(0).toUpperCase() + (orderData.priority || 'medium').slice(1)}
              </span>
            </div>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
          
          <!-- Company Information Column -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">🏢</span> Company Information
            </h3>
            
            <div style="space-y: 15px;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">Company Name:</strong>
                <span style="color: #1f2937;">${orderData.company_name}</span>
              </div>
              
              ${orderData.company_address ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📍 Address:</strong>
                <span style="color: #1f2937;">${orderData.company_address}</span>
              </div>` : ''}
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📧 Email:</strong>
                <a href="mailto:${orderData.contact_email}" style="color: #2563eb; text-decoration: none;">${orderData.contact_email}</a>
              </div>
              
              ${orderData.contact_phone ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📞 Phone:</strong>
                <a href="tel:${orderData.contact_phone}" style="color: #2563eb; text-decoration: none;">${orderData.contact_phone}</a>
              </div>` : ''}
              
              ${orderData.company_link ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">🌐 Website:</strong>
                <a href="${orderData.company_link}" target="_blank" style="color: #2563eb; text-decoration: none; word-break: break-all;">${orderData.company_link}</a>
              </div>` : ''}
            </div>
          </div>

          <!-- Order Details Column -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📋</span> Order Details
            </h3>
            
            <div style="space-y: 15px;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">💰 Price:</strong>
                <span style="font-size: 20px; color: #059669; font-weight: bold;">${formatCurrency(orderData.price || 0, orderData.currency || 'EUR')}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">💱 Currency:</strong>
                <span style="color: #1f2937;">${orderData.currency || 'EUR'}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">⚡ Priority:</strong>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; ${getPriorityBadgeStyle(orderData.priority || 'medium')}">
                  ${(orderData.priority || 'medium').charAt(0).toUpperCase() + (orderData.priority || 'medium').slice(1)}
                </span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📊 Status:</strong>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: #dbeafe; color: #1e40af;">
                  ${orderData.status || 'Created'}
                </span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">👤 Assigned To:</strong>
                <span style="color: #1f2937;">${assignedToName || 'Not assigned'}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📅 Created:</strong>
                <span style="color: #1f2937;">${formatDate(orderData.created_at || new Date().toISOString())}</span>
              </div>
              
              <div style="margin-bottom: 0;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">🕒 Last Updated:</strong>
                <span style="color: #1f2937;">${formatDate(orderData.created_at || new Date().toISOString())}</span>
              </div>
            </div>
          </div>
        </div>

        ${selectedInventoryItems && selectedInventoryItems.length > 0 ? `
        <!-- Inventory Items Section -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📦</span> Inventory Items
          </h3>
          <ul style="padding-left: 20px; margin: 0; list-style-type: disc;">
            ${formatInventoryItems(selectedInventoryItems)}
          </ul>
        </div>` : ''}

        ${orderData.description ? `
        <!-- Description Section -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📝</span> Description
          </h3>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${orderData.description}</p>
          </div>
        </div>` : ''}

        ${orderData.internal_notes ? `
        <!-- Internal Notes Section -->
        <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; border: 1px solid #f59e0b; margin-bottom: 25px;">
          <h3 style="color: #92400e; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">🔒</span> Internal Notes
          </h3>
          <div style="background-color: #fef7e0; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; white-space: pre-wrap; color: #92400e; line-height: 1.6;">${orderData.internal_notes}</p>
          </div>
        </div>` : ''}

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-top: 30px; text-align: center; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
            This email was automatically generated by Empria Dental.
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Visit us at: <a href="https://empriadental.de" style="color: #2563eb; text-decoration: none; font-weight: 500;">empriadental.de</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const results = [];
    
    // Send email to each recipient with delay to respect rate limits (2 requests per second)
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
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
      
      // Add 600ms delay between emails to respect Resend's rate limit (2 requests per second)
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
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
