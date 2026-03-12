import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerId, action } = await req.json();

    if (!offerId) {
      throw new Error('offerId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // If action is 'fetch', just return the offer details
    if (action === 'fetch') {
      const { data: offer, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (error || !offer) {
        throw new Error('Offer not found');
      }

      return new Response(JSON.stringify({ success: true, offer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default action: confirm the offer
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) {
      throw new Error('Offer not found');
    }

    if (offer.confirmed_at) {
      return new Response(JSON.stringify({ success: false, alreadyConfirmed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse order_data JSON
    const orderData = (offer.order_data || {}) as Record<string, any>;

    // Create the order from offer data
    const { data: createdOrder, error: orderError } = await supabase.from('orders').insert({
      company_name: offer.company_name,
      contact_email: offer.client_email,
      contact_name: offer.client_name,
      contact_phone: offer.client_phone || null,
      company_address: offer.client_address || null,
      company_link: orderData.companyLink || null,
      description: offer.description || '',
      internal_notes: orderData.internalNotes || null,
      price: offer.price,
      currency: offer.currency,
      status: 'Created',
      priority: orderData.priority || 'medium',
      created_by: offer.sent_by,
      assigned_to: offer.sent_by,
      assigned_to_name: offer.sent_by_name,
      status_created: true,
    }).select('id').single();

    if (orderError) {
      console.error('Error creating order from offer:', orderError);
      throw new Error('Failed to create order');
    }

    // Fire-and-forget: send team notification emails
    const teamEmails = [
      'angelina@abmedia-team.com',
      'service@team-abmedia.com',
      'thomas.thomasklein@gmail.com',
      'kleinabmedia@gmail.com',
      'jungabmedia@gmail.com',
      'wolfabmedia@gmail.com',
      'marcusabmedia@gmail.com',
      'paulkatz.abmedia@gmail.com',
      'ajosesales36@gmail.com',
      'georgabmediateam@gmail.com',
      'jannes@scoolfinanceedu.com',
      'johan@team-abmedia.com'
    ];

    const notificationOrderData = {
      company_name: offer.company_name,
      contact_email: offer.client_email,
      contact_phone: offer.client_phone || null,
      company_address: offer.client_address || null,
      company_link: orderData.companyLink || null,
      description: offer.description || '',
      internal_notes: orderData.internalNotes || null,
      price: offer.price,
      currency: offer.currency,
      status: 'Created',
      priority: orderData.priority || 'medium',
      created_at: new Date().toISOString(),
    };

    fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        orderData: notificationOrderData,
        emails: teamEmails,
        assignedToName: offer.sent_by_name,
        selectedInventoryItems: orderData.inventoryItems || [],
      }),
    }).catch(err => console.error('Failed to send team notification:', err));

    // Update offer status
    const { error: updateError } = await supabase
      .from('offers')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', offerId);

    if (updateError) {
      console.error('Error updating offer status:', updateError);
    }

    console.log('Offer confirmed and order created for:', offer.client_email);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in confirm-offer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
