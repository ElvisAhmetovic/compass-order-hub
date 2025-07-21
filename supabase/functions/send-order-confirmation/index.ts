import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderData: {
    id: string;
    company_name: string;
    contact_email: string;
    contact_phone?: string;
    company_address?: string;
    company_link?: string;
    description?: string;
    internal_notes?: string;
    price: number;
    currency: string;
    status: string;
    priority: string;
    created_at: string;
  };
  emails: string[];
  assignedToName?: string;
  selectedInventoryItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method);
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { orderData, emails, assignedToName, selectedInventoryItems }: OrderConfirmationRequest = requestBody;

    console.log(`Sending order confirmation for order ${orderData.id} to ${emails.length} recipient(s)`);

    // Format date
    const formattedDate = new Date(orderData.created_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: orderData.currency
    }).format(orderData.price);

    // Format inventory items
    let inventorySection = '';
    if (selectedInventoryItems && selectedInventoryItems.length > 0) {
      inventorySection = `
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #2563eb; font-size: 16px;">Inventory Items</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${selectedInventoryItems.map(item => `
              <li style="margin: 5px 0;">${item.name} - Quantity: ${item.quantity} ${item.unit}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Format description with proper line breaks
    const formattedDescription = orderData.description ? 
      orderData.description.replace(/\n/g, '<br>').replace(/•/g, '&bull;') : '';

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Order Created</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Order ID: ${orderData.id}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #2563eb; margin: 0 0 20px 0; font-size: 20px;">Order Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 30%;">Company:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${orderData.company_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Contact Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${orderData.contact_email}</td>
            </tr>
            ${orderData.contact_phone ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${orderData.contact_phone}</td>
            </tr>
            ` : ''}
            ${orderData.company_address ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Address:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${orderData.company_address}</td>
            </tr>
            ` : ''}
            ${orderData.company_link ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Company Link:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><a href="${orderData.company_link}" target="_blank" style="color: #2563eb;">${orderData.company_link}</a></td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Price:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 18px; font-weight: bold; color: #059669;">${formattedPrice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Status:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${orderData.status}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Priority:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="text-transform: capitalize;">${orderData.priority}</span></td>
            </tr>
            ${assignedToName ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Assigned To:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${assignedToName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Created:</td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
          </table>

          ${inventorySection}

          ${formattedDescription ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #2563eb; font-size: 16px;">Description</h3>
            <div style="white-space: pre-line; font-size: 14px;">
              ${formattedDescription}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280; text-align: center;">
          <p style="margin: 0;"><strong>AB Media Team</strong></p>
          <p style="margin: 5px 0 0 0;">This is an automated order confirmation. For any questions, please contact our team.</p>
        </div>
      </body>
      </html>
    `;

    // Send emails to all recipients
    const emailPromises = emails.map(async (email) => {
      return await resend.emails.send({
        from: "AB Media Team <orders@empriadental.de>",
        to: [email],
        subject: `New Order Created - ${orderData.company_name} (${formattedPrice})`,
        html: htmlContent,
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    // Check for any failures
    const failures = emailResults.filter(result => result.status === 'rejected');
    const successes = emailResults.filter(result => result.status === 'fulfilled');

    console.log(`Sent ${successes.length} emails successfully, ${failures.length} failed`);

    if (failures.length > 0) {
      console.error("Some emails failed to send:", failures);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Order confirmation sent to ${successes.length} recipient(s)${failures.length > 0 ? `, ${failures.length} failed` : ''}`,
      successCount: successes.length,
      failureCount: failures.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: "Failed to send order confirmation emails"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);