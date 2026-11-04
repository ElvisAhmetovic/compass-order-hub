import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
export const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

/** Returns the signed-in team member (not a client), or null. */
export async function getTeamUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await sb.auth.getClaims(auth.slice(7));
  const uid = data?.claims?.sub;
  if (error || !uid) return null;
  const db = admin();
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", uid);
  if ((roles ?? []).some((r: { role: string }) => r.role === "client")) return null;
  const { data: prof } = await db.from("profiles").select("full_name, email").eq("id", uid).maybeSingle();
  return { id: uid as string, name: (prof?.full_name || prof?.email || "") as string };
}

async function hmac(text: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
export const unsubscribeToken = (email: string) => hmac(`unsub:${email.toLowerCase()}`);
