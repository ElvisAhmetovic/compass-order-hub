import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function generatePassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('orderId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, contact_email, contact_name, company_name, client_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (!order.contact_email) {
      throw new Error('No contact email on this order');
    }

    const clientEmail = order.contact_email.toLowerCase().trim();
    const clientName = order.contact_name || order.company_name || 'Client';
    const companyName = order.company_name;

    // Rate limit: check audit logs for recent credential sends for this order
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('order_audit_logs')
      .select('id')
      .eq('order_id', orderId)
      .in('action', ['client_portal_credentials_sent', 'client_portal_credentials_resent', 'client_self_service_credentials'])
      .gte('created_at', fiveMinutesAgo)
      .limit(1);

    if (recentLogs && recentLogs.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credentials were recently sent. Please check your email or try again in a few minutes.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', clientEmail)
      .eq('role', 'client')
      .maybeSingle();

    const password = generatePassword();
    let userId: string;

    if (existingProfile) {
      // Update password for existing user
      userId = existingProfile.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
      });
      if (updateError) {
        console.error('Error updating user password:', updateError);
        throw new Error('Failed to update credentials');
      }
    } else {
      // Create new client user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: clientEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: clientName.split(' ')[0] || clientName,
          last_name: clientName.split(' ').slice(1).join(' ') || '',
          role: 'client',
        },
      });

      if (createError) {
        // If user exists in auth but not as client profile, try updating
        if (createError.message?.includes('already been registered')) {
          // Look up the auth user by email
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const authUser = users?.find(u => u.email?.toLowerCase() === clientEmail);
          if (authUser) {
            userId = authUser.id;
            await supabase.auth.admin.updateUserById(userId, { password });
            // Update profile role
            await supabase.from('profiles').update({ role: 'client' }).eq('id', userId);
          } else {
            throw new Error('Failed to find or create user');
          }
        } else {
          throw new Error(`Failed to create user: ${createError.message}`);
        }
      } else {
        userId = newUser.user!.id;
      }

      // Update profile role to client
      await supabase.from('profiles').update({ 
        role: 'client',
        email: clientEmail,
      }).eq('id', userId!);

      // Link this order to the client
      await supabase.from('orders').update({ client_id: userId! }).eq('id', orderId);

      // Bulk-link other orders with same email
      await supabase
        .from('orders')
        .update({ client_id: userId! })
        .ilike('contact_email', clientEmail)
        .is('client_id', null);
    }

    // Send credentials email via existing function
    const credRes = await fetch(`${supabaseUrl}/functions/v1/send-client-portal-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        clientEmail,
        clientName,
        password,
        companyName,
        senderName: 'AB Media Team',
        senderId: null,
        orderId,
        isResend: !!existingProfile,
      }),
    });

    if (!credRes.ok) {
      const errText = await credRes.text();
      console.error('Failed to send credentials email:', errText);
      throw new Error('Failed to send credentials email');
    }

    // Audit log
    await supabase.from('order_audit_logs').insert({
      order_id: orderId,
      action: 'client_self_service_credentials',
      details: `Client self-service credential request for ${clientEmail} (${companyName})`,
    });

    console.log('Self-service credentials sent to:', clientEmail);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in request-client-credentials:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
