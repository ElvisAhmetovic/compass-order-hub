
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()
    
    // Delete user data from all tables (in order to respect foreign keys)
    const tables = [
      'support_replies',
      'support_inquiries', 
      'messages',
      'invoice_line_items',
      'invoices',
      'clients',
      'orders',
      'user_settings',
      'user_permissions',
      'profiles'
    ]

    for (const table of tables) {
      await supabaseClient
        .from(table)
        .delete()
        .eq(table === 'profiles' ? 'id' : 'user_id', userId)
    }

    // Finally, delete the auth user
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)
    
    if (authError) {
      throw authError
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
