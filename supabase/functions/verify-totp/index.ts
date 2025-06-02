
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple TOTP verification (in production, use a proper TOTP library)
function verifyTOTP(secret: string, token: string): boolean {
  // This is a simplified implementation
  // In production, use a proper TOTP library like @noble/otp
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  
  // Check current time step and ±1 for clock drift
  for (let i = -1; i <= 1; i++) {
    const testTimeStep = timeStep + i;
    const hash = generateTOTP(secret, testTimeStep);
    if (hash === token) {
      return true;
    }
  }
  return false;
}

function generateTOTP(secret: string, timeStep: number): string {
  // Simplified TOTP generation - use proper crypto library in production
  const combined = secret + timeStep.toString();
  const hash = Array.from(new TextEncoder().encode(combined))
    .reduce((acc, byte) => acc + byte, 0);
  return (hash % 1000000).toString().padStart(6, '0');
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

    const { secret, token: totpToken, userId } = await req.json()
    
    // Verify the user can only validate their own TOTP
    if (userId !== user.id) {
      throw new Error('Unauthorized access')
    }
    
    const isValid = verifyTOTP(secret, totpToken)
    
    if (!isValid) {
      throw new Error('Invalid TOTP token')
    }

    return new Response(
      JSON.stringify({ valid: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('TOTP verification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
