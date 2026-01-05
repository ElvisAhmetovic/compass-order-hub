import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64URL encode for JWT
function base64UrlEncode(data: string): string {
  const base64 = btoa(data);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Create JWT for Google API authentication
async function createJWT(clientEmail: string, privateKey: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${signatureInput}.${encodedSignature}`;
}

// Get access token from Google
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const jwt = await createJWT(clientEmail, privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get access token:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Format a single order into a row
function formatOrderRow(orderData: any, syncType: string): string[] {
  return [
    orderData.id || '',
    orderData.company_name || '',
    orderData.contact_email || '',
    orderData.contact_phone || '',
    orderData.company_address || '',
    orderData.price?.toString() || '0',
    orderData.currency || 'EUR',
    orderData.status || '',
    orderData.priority || '',
    orderData.description || '',
    orderData.assigned_to_name || '',
    orderData.is_yearly_package ? 'Yes' : 'No',
    orderData.created_at || new Date().toISOString(),
    orderData.updated_at || new Date().toISOString(),
    syncType || 'create',
  ];
}

// Append rows to Google Sheet
async function appendToSheet(
  accessToken: string,
  spreadsheetId: string,
  values: string[][]
): Promise<void> {
  const range = 'Sheet1!A:O'; // Columns A through O
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to append to sheet:', error);
    throw new Error(`Failed to append to sheet: ${error}`);
  }

  console.log(`Successfully appended ${values.length} row(s) to Google Sheet`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientEmail = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY');
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing Google Sheets configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderData, ordersData, syncType } = await req.json();

    // Handle batch sync (multiple orders)
    if (ordersData && Array.isArray(ordersData)) {
      console.log(`Batch syncing ${ordersData.length} orders to Google Sheets`);
      
      const accessToken = await getAccessToken(clientEmail, privateKey);
      const rows = ordersData.map((order: any) => formatOrderRow(order, syncType || 'bulk_sync'));
      
      await appendToSheet(accessToken, spreadsheetId, rows);
      
      console.log(`Successfully synced ${ordersData.length} orders`);
      
      return new Response(
        JSON.stringify({ success: true, message: `${ordersData.length} orders synced to Google Sheets` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single order sync
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: 'Order data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing order ${orderData.id} to Google Sheets (${syncType})`);

    // Get access token
    const accessToken = await getAccessToken(clientEmail, privateKey);

    // Format and append single order
    const row = formatOrderRow(orderData, syncType);
    await appendToSheet(accessToken, spreadsheetId, [row]);

    console.log(`Order ${orderData.id} synced successfully`);

    return new Response(
      JSON.stringify({ success: true, message: 'Order synced to Google Sheets' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing order to Google Sheets:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
