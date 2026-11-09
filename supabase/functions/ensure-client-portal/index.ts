import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { decidePortalAction, normalizeEmail } from "../_shared/portalRules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function generatePassword(length = 14): string {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789"];
  const all = sets.join("") + "!@#$%";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  const out = sets.map((s, i) => s[arr[i] % s.length]);
  for (let i = out.length; i < length; i++) out.push(all[arr[i] % all.length]);
  return out.join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const token = authHeader.replace("Bearer ", "").trim();
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, serviceKey);

  let actorId: string | null = null;
  if (token !== serviceKey) {
    const authClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: roles } = await db.from("user_roles").select("role").eq("user_id", user.id);
    const isTeam = (roles ?? []).some((r: { role: string }) => ["admin", "agent", "user"].includes(r.role));
    if (!isTeam) return json({ error: "Forbidden" }, 403);
    actorId = user.id;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const name = String(body?.name ?? "").slice(0, 200).trim() || "Client";
    const companyName = body?.companyName ? String(body.companyName).slice(0, 200) : null;
    const orderId: string | null = typeof body?.orderId === "string" ? body.orderId : null;

    const { data: existing } = await db.from("app_users").select("id").ilike("email", email).eq("role", "client").maybeSingle();
    const decision = decidePortalAction(email, !!existing);
    if (decision.action === "skip") return json({ status: "skipped", reason: decision.reason });

    let userId = existing?.id as string | undefined;
    let password: string | null = null;

    if (decision.action === "create_and_send") {
      password = generatePassword();
      const { data: created, error } = await db.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" "), role: "client" },
      });
      if (error) {
        // Auth user already exists (e.g. created elsewhere): link only, never reset the password.
        if (!error.message?.includes("already been registered")) throw error;
        for (let page = 1; page <= 20 && !userId; page++) {
          const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
          const users = data?.users ?? [];
          userId = users.find((u) => u.email?.toLowerCase() === email)?.id;
          if (users.length < 1000) break;
        }
        if (!userId) throw new Error("User lookup failed");
        const { data: r } = await db.from("user_roles").select("role").eq("user_id", userId);
        if ((r ?? []).some((x: { role: string }) => x.role !== "client")) return json({ status: "skipped", reason: "team_email" });
        password = null;
      } else {
        userId = created.user!.id;
      }
      await db.from("profiles").update({ role: "client" }).eq("id", userId);
      await db.from("user_roles").upsert({ user_id: userId, role: "client" }, { onConflict: "user_id,role", ignoreDuplicates: true });
      await db.from("app_users").upsert({ id: userId, email, full_name: name, role: "client" }, { onConflict: "id", ignoreDuplicates: true });
    }

    // Link every unlinked order with this email
    await db.from("orders").update({ client_id: userId }).ilike("contact_email", email).is("client_id", null);

    if (password) {
      const res = await fetch(`${url}/functions/v1/send-client-portal-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ clientEmail: email, clientName: name, password, companyName, senderName: "Media Marketing", senderId: actorId, orderId, isResend: false }),
      });
      if (!res.ok) console.error("credentials email failed", await res.text());
      if (orderId) {
        await db.from("order_audit_logs").insert({ order_id: orderId, actor_id: actorId, action: "client_portal_auto_created", details: `Portal account created automatically for ${email}` });
      }
      return json({ status: "created" });
    }
    return json({ status: "linked" });
  } catch (e) {
    console.error("ensure-client-portal error", e);
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
