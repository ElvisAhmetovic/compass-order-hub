
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
    
    // Verify the user can only access their own processing info
    if (userId !== user.id) {
      throw new Error('Unauthorized access')
    }

    const processingInfo = {
      userId: userId,
      generatedAt: new Date().toISOString(),
      dataController: "Order Flow Compass",
      legalBasis: "Legitimate interest for providing order management services",
      dataProcessingPurposes: [
        "Order management and tracking",
        "Client relationship management",
        "Invoice generation and payment processing",
        "User authentication and security"
      ],
      dataCategories: [
        "Personal identification data",
        "Contact information",
        "Order and transaction data",
        "Authentication credentials"
      ],
      retentionPeriod: "Data is retained for 7 years after account closure for legal compliance",
      dataRecipients: [
        "Internal team members with appropriate access",
        "Payment processors (for invoice payments)",
        "Cloud hosting providers (Supabase)"
      ],
      userRights: [
        "Right to access your personal data",
        "Right to rectification of inaccurate data",
        "Right to erasure (right to be forgotten)",
        "Right to data portability",
        "Right to restrict processing",
        "Right to object to processing"
      ],
      securityMeasures: [
        "Data encryption in transit and at rest",
        "Access controls and authentication",
        "Regular security audits",
        "Row-level security policies"
      ]
    }

    return new Response(
      JSON.stringify(processingInfo),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Get data processing info error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
