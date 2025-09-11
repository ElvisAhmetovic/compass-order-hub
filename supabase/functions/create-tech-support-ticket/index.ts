import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

// CORS configuration for Lovable projects
const ALLOWED_ORIGINS = [
  'https://ab4babd7-978c-4acd-b78b-5f6332997961.lovableproject.com',
  'http://localhost:5173', // For local development
  'http://localhost:3000'
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
};

interface AttachmentData {
  name: string;
  type: string;
  size: number;
  base64: string;
}

interface TicketRequest {
  company_name: string;
  problem_description: string;
  action_needed: string;
  attachments?: AttachmentData[];
}

// Default emails for notifications
const DEFAULT_EMAILS = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'kleinabmedia@gmail.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com'
];

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request from origin:', origin);
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }

  try {
    console.log('Creating Supabase client...');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const ticketData: TicketRequest = await req.json();
    console.log('Ticket data received:', {
      company_name: ticketData.company_name,
      attachmentCount: ticketData.attachments?.length || 0
    });

    // Validate required fields
    if (!ticketData.company_name?.trim() || !ticketData.problem_description?.trim() || !ticketData.action_needed?.trim()) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const displayName = profile ? 
      `${profile.first_name} ${profile.last_name}`.trim() || user.email : 
      user.email || 'Unknown User';

    console.log('Creating ticket...');

    // 1. Create tech support ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tech_support_tickets')
      .insert([{
        company_name: ticketData.company_name.trim(),
        problem_description: ticketData.problem_description.trim(),
        action_needed: ticketData.action_needed.trim(),
        created_by: user.id,
        created_by_name: displayName,
        status: 'in_progress'
      }])
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      throw ticketError;
    }

    console.log('Ticket created:', ticket.id);

    const attachmentRecords = [];

    // 2. Process attachments if any
    if (ticketData.attachments && ticketData.attachments.length > 0) {
      console.log(`Processing ${ticketData.attachments.length} attachments...`);
      
      for (const attachment of ticketData.attachments) {
        try {
          console.log(`Processing attachment: ${attachment.name}`);
          
          // Generate unique filename
          const fileExt = attachment.name.split('.').pop() || 'bin';
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${ticket.id}/${fileName}`;  // Fixed: removed double prefix

          // Convert base64 to binary
          const binaryData = Uint8Array.from(atob(attachment.base64), c => c.charCodeAt(0));

          console.log(`Uploading to storage: ${filePath}`);

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(filePath, binaryData, {
              contentType: attachment.type,
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          console.log('Upload successful, creating DB record...');

          // Create database record
          const { data: attachmentRecord, error: dbError } = await supabase
            .from('ticket_attachments')
            .insert([{
              ticket_id: ticket.id,
              user_id: user.id,
              path: filePath,
              mime_type: attachment.type,
              size_bytes: attachment.size,
              original_name: attachment.name,
              // Set width/height for images if needed
              width: attachment.type.startsWith('image/') ? null : null,
              height: attachment.type.startsWith('image/') ? null : null
            }])
            .select()
            .single();

          if (dbError) {
            console.error('DB record error:', dbError);
            throw dbError;
          }

          console.log('Attachment record created:', attachmentRecord.id);

          // Generate signed URL for email (7 days)
          const { data: signedUrl } = await supabase.storage
            .from('ticket-attachments')
            .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

          attachmentRecords.push({
            ...attachmentRecord,
            signedUrl: signedUrl?.signedUrl
          });

        } catch (attachmentError) {
          console.error(`Error processing attachment ${attachment.name}:`, attachmentError);
          // Continue with other attachments, don't fail the entire request
        }
      }
    }

    console.log(`Processed ${attachmentRecords.length} attachments successfully`);

    // 3. Send notification email
    try {
      console.log('Sending notification email...');
      
      const emailPayload = {
        ticketData: {
          id: ticket.id,
          company_name: ticket.company_name,
          problem_description: ticket.problem_description,
          action_needed: ticket.action_needed,
          status: ticket.status,
          created_by_name: ticket.created_by_name,
          created_at: ticket.created_at,
          attachments: attachmentRecords
        },
        emails: DEFAULT_EMAILS
      };

      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-tech-support-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Email notification failed:', errorText);
      } else {
        console.log('Email notification sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    // 4. Return success response
    return new Response(JSON.stringify({ 
      ticketId: ticket.id,
      attachmentCount: attachmentRecords.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in create-tech-support-ticket function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);