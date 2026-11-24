import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Returns the admin caller or a 401/403 response. */
export async function requireAdmin(req: Request, clients: typeof createClient = createClient): Promise<{ userId: string; email: string | null; db: SupabaseClient; auth: string } | Response> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const anon = clients(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data, error } = await anon.auth.getClaims(auth.slice(7));
  if (error || !data?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const db = clients(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", data.claims.sub);
  if (!(roles ?? []).some((r: { role: string }) => r.role === "admin")) return json({ error: "Forbidden" }, 403);
  return { userId: data.claims.sub as string, email: (data.claims.email as string) ?? null, db, auth };
}

/** Automatic reminders accept the scheduler's service credential or a verified admin. */
export async function requireReminderCaller(req: Request, adminCheck = requireAdmin, serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")): Promise<Response | null> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (serviceKey && token === serviceKey) return null;
  const admin = await adminCheck(req);
  return admin instanceof Response ? admin : null;
}
