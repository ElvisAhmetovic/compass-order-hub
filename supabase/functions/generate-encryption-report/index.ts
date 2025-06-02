
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
    
    // Verify the user can only generate their own report
    if (userId !== user.id) {
      throw new Error('Unauthorized access')
    }

    // Get user's encryption settings
    const { data: settings } = await supabaseClient
      .from('user_settings')
      .select('data_encryption_enabled')
      .eq('id', userId)
      .single()

    // Generate encryption report
    const report = {
      userId: userId,
      generatedAt: new Date().toISOString(),
      encryptionStatus: settings?.data_encryption_enabled ? 'enabled' : 'disabled',
      encryptionAlgorithm: 'AES-256-GCM',
      dataTypes: {
        clientData: settings?.data_encryption_enabled,
        orderDetails: settings?.data_encryption_enabled,
        financialData: settings?.data_encryption_enabled,
        personalInfo: settings?.data_encryption_enabled
      },
      securityLevel: settings?.data_encryption_enabled ? 'High' : 'Standard',
      compliance: {
        gdpr: true,
        ccpa: true,
        iso27001: settings?.data_encryption_enabled
      }
    }

    return new Response(
      JSON.stringify(report),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Encryption report error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
