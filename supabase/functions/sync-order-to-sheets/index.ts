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

  // Process the private key - handle escaped newlines from JSON
  const processedKey = privateKey.replace(/\\n/g, '\n');
  
  // Extract the base64 content from the PEM format
  const pemContents = processedKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\r\n\s]/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

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
  // Prefix phone with apostrophe to prevent Google Sheets from interpreting + as formula
  const safePhone = orderData.contact_phone 
    ? `'${orderData.contact_phone}` 
    : '';

  return [
    orderData.id || '',
    orderData.company_name || '',
    orderData.contact_email || '',
    safePhone,
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

// Get existing order IDs from column A
async function getExistingOrderIds(
  accessToken: string,
  spreadsheetId: string
): Promise<Map<string, number>> {
  const range = 'Sheet1!A:A';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  const orderIdToRow = new Map<string, number>();

  if (!response.ok) {
    console.log('No existing data in sheet or error reading, starting fresh');
    return orderIdToRow;
  }

  const data = await response.json();
  const values = data.values || [];

  values.forEach((row: string[], index: number) => {
    if (row[0] && row[0] !== 'ID') { // Skip header row if exists
      orderIdToRow.set(row[0], index + 1); // 1-indexed for Sheets API
    }
  });

  console.log(`Found ${orderIdToRow.size} existing orders in sheet`);
  return orderIdToRow;
}

// Update a specific row in the sheet
async function updateSheetRow(
  accessToken: string,
  spreadsheetId: string,
  rowNumber: number,
  values: string[]
): Promise<void> {
  const range = `Sheet1!A${rowNumber}:O${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [values] }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update row ${rowNumber}: ${error}`);
  }
}

// Append rows to Google Sheet
async function appendToSheet(
  accessToken: string,
  spreadsheetId: string,
  values: string[][]
): Promise<void> {
  const range = 'Sheet1!A:O';
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

// Smart sync: update existing orders, append new ones
async function smartSyncOrders(
  accessToken: string,
  spreadsheetId: string,
  orders: any[],
  syncType: string
): Promise<{ updated: number; added: number }> {
  // Get existing order IDs and their row numbers
  const orderIdToRow = await getExistingOrderIds(accessToken, spreadsheetId);

  let updated = 0;
  let added = 0;
  const newOrders: string[][] = [];

  for (const order of orders) {
    const row = formatOrderRow(order, syncType);
    const existingRowNumber = orderIdToRow.get(order.id);

    if (existingRowNumber) {
      // Update existing row
      await updateSheetRow(accessToken, spreadsheetId, existingRowNumber, row);
      updated++;
    } else {
      // Collect new orders to append in batch
      newOrders.push(row);
      added++;
    }
  }

  // Append all new orders at once
  if (newOrders.length > 0) {
    await appendToSheet(accessToken, spreadsheetId, newOrders);
  }

  return { updated, added };
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

    // Handle batch sync (multiple orders) with smart sync
    if (ordersData && Array.isArray(ordersData)) {
      console.log(`Smart syncing ${ordersData.length} orders to Google Sheets`);
      
      const accessToken = await getAccessToken(clientEmail, privateKey);
      const result = await smartSyncOrders(accessToken, spreadsheetId, ordersData, syncType || 'smart_sync');
      
      console.log(`Smart sync complete: ${result.updated} updated, ${result.added} added`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Synced ${ordersData.length} orders (${result.updated} updated, ${result.added} new)`,
          updated: result.updated,
          added: result.added
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single order sync with smart sync
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: 'Order data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Smart syncing order ${orderData.id} to Google Sheets (${syncType})`);

    const accessToken = await getAccessToken(clientEmail, privateKey);
    const result = await smartSyncOrders(accessToken, spreadsheetId, [orderData], syncType || 'single_sync');

    const action = result.updated > 0 ? 'updated' : 'added';
    console.log(`Order ${orderData.id} ${action} successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Order ${action} in Google Sheets`,
        updated: result.updated,
        added: result.added
      }),
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
