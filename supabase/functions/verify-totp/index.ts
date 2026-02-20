import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Base32 decoding for TOTP secrets
function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  
  let bits = '';
  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  
  return bytes;
}

// Generate HOTP value using HMAC-SHA1
function generateHOTP(secret: Uint8Array, counter: bigint): string {
  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, counter, false);
  
  // Create HMAC-SHA1
  const hmac = createHmac('sha1', Buffer.from(secret));
  hmac.update(Buffer.from(counterBuffer));
  const hash = hmac.digest();
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = 
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  // Generate 6-digit OTP
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

// Verify TOTP with time window for clock drift
function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  try {
    const secretBytes = base32Decode(secret);
    const timeStep = BigInt(Math.floor(Date.now() / 1000 / 30));
    
    // Check current time step and ±window for clock drift
    for (let i = -window; i <= window; i++) {
      const testTimeStep = timeStep + BigInt(i);
      const expectedToken = generateHOTP(secretBytes, testTimeStep);
      
      // Constant-time comparison to prevent timing attacks
      if (constantTimeEqual(expectedToken, token)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
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
    
    // Validate inputs
    if (!secret || typeof secret !== 'string') {
      throw new Error('Invalid secret')
    }
    
    if (!totpToken || typeof totpToken !== 'string' || !/^\d{6}$/.test(totpToken)) {
      throw new Error('Invalid TOTP token format - must be 6 digits')
    }
    
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
