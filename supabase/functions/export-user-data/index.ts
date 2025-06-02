
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { userId } = await req.json()
    
    // Verify the user can only export their own data
    if (userId !== user.id) {
      throw new Error('Unauthorized: You can only export your own data')
    }
    
    // Collect user data from all relevant tables
    const userData: any = {
      exportDate: new Date().toISOString(),
      userId: userId,
      profile: null,
      orders: [],
      clients: [],
      invoices: [],
      messages: [],
      support_inquiries: [],
      user_settings: null
    }

    // Get profile data
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    userData.profile = profile

    // Get orders
    const { data: orders } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('created_by', userId)
    userData.orders = orders || []

    // Get clients
    const { data: clients } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('user_id', userId)
    userData.clients = clients || []

    // Get invoices
    const { data: invoices } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
    userData.invoices = invoices || []

    // Get messages
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
    userData.messages = messages || []

    // Get support inquiries
    const { data: support } = await supabaseClient
      .from('support_inquiries')
      .select('*')
      .eq('user_id', userId)
    userData.support_inquiries = support || []

    // Get user settings
    const { data: settings } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('id', userId)
      .single()
    userData.user_settings = settings

    return new Response(
      JSON.stringify(userData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Export user data error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
