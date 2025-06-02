
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
    
    // Verify the user can only delete their own data
    if (userId !== user.id) {
      throw new Error('Unauthorized: You can only delete your own data')
    }
    
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
    const { error: authError2 } = await supabaseClient.auth.admin.deleteUser(userId)
    
    if (authError2) {
      throw authError2
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Delete user data error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
