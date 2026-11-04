import { GatewayError } from "npm:@lovable.dev/ai-gateway";
import { generateDraft, pastServices, topServices, type OutreachOrder } from "../_shared/outreachDraft.ts";
import { admin, corsHeaders, getTeamUser, json } from "../_shared/outreachAuth.ts";
import { COOLDOWN_DAYS, inCooldown, isInactive, isWinBack, SCAN_BATCH } from "../_shared/outreachRules.ts";

type Order = OutreachOrder;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const fromCron = body?.source === "cron";
  if (!fromCron && !(await getTeamUser(req))) return json({ error: "Unauthorized" }, 401);

  const db = admin();
  // Single-flight lock (10 minutes) + paused-state guard
  const { data: lock } = await db.from("outreach_scan_lock").select("*").eq("id", 1).maybeSingle();
  if (lock?.paused_reason && fromCron) return json({ skipped: "paused", reason: lock.paused_reason });
  const nowIso = new Date().toISOString();
  const { data: got } = await db.from("outreach_scan_lock")
    .update({ locked_until: new Date(Date.now() + 10 * 60_000).toISOString(), paused_reason: null })
    .eq("id", 1).lt("locked_until", nowIso).select();
  if (!got?.length) return json({ skipped: "already running" });

  try {
    const now = new Date();
    const orders: Order[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from("orders")
        .select("id, contact_email, company_name, company_address, description, price, amount, currency, created_at, contact_name")
        .is("deleted_at", null).not("contact_email", "is", null)
        .order("created_at", { ascending: false }).range(from, from + 999);
      if (error) throw error;
      orders.push(...(data as Order[]));
      if (!data || data.length < 1000) break;
    }

    const ourServices = topServices(orders);

    const byEmail = new Map<string, Order[]>();
    for (const o of orders) {
      const e = o.contact_email!.trim().toLowerCase();
      if (!e.includes("@")) continue;
      if (!byEmail.has(e)) byEmail.set(e, []);
      byEmail.get(e)!.push(o);
    }

    // Win-back tracking: link a new order to the sent offer it followed
    const { data: openSent } = await db.from("outreach_drafts").select("id, email, sent_at")
      .eq("status", "sent").is("won_back_order_id", null).not("sent_at", "is", null);
    for (const d of openSent ?? []) {
      const os = byEmail.get(d.email.toLowerCase()) ?? [];
      const hit = [...os].reverse().find((o) => isWinBack(new Date(d.sent_at), new Date(o.created_at)));
      if (hit?.id) await db.from("outreach_drafts").update({ won_back_order_id: hit.id, won_back_at: hit.created_at }).eq("id", d.id);
    }

    const [{ data: optOuts }, { data: contracts }, { data: noMail }, { data: recent }] = await Promise.all([
      db.from("outreach_opt_outs").select("email"),
      db.from("monthly_contracts").select("client_email").eq("status", "active"),
      db.from("clients").select("email").eq("auto_reminders_enabled", false),
      db.from("outreach_drafts").select("email, created_at")
        .gte("created_at", new Date(now.getTime() - COOLDOWN_DAYS * 86_400_000).toISOString()),
    ]);
    const skip = new Set<string>([
      ...(optOuts ?? []).map((r) => r.email),
      ...(contracts ?? []).map((r) => r.client_email),
      ...(noMail ?? []).map((r) => r.email),
    ].filter(Boolean).map((e: string) => e.trim().toLowerCase()));
    const lastContact = new Map<string, Date>();
    for (const r of recent ?? []) lastContact.set(r.email.toLowerCase(), new Date(r.created_at));

    const candidates = [...byEmail.entries()]
      .filter(([e, os]) => !skip.has(e) && isInactive(new Date(os[0].created_at), now) && !inCooldown(lastContact.get(e) ?? null, now))
      .sort((a, b) => b[1][0].created_at.localeCompare(a[1][0].created_at)) // most recently lapsed first
      .slice(0, SCAN_BATCH);

    let created = 0;
    for (const [email, os] of candidates) {
      try {
        const parsed = await generateDraft(email, os, ourServices);
        const { error } = await db.from("outreach_drafts").insert({
          email, company_name: os[0].company_name, language: parsed.language, subject: parsed.subject,
          body: parsed.body, reason: parsed.reason, last_order_at: os[0].created_at,
          past_services: pastServices(os),
        });
        if (!error) created++;
      } catch (e) {
        if (e instanceof GatewayError && [402, 403, 429].includes(e.httpStatus ?? 0)) {
          await db.from("outreach_scan_lock").update({ paused_reason: `AI service ${e.httpStatus}: ${e.message}` }).eq("id", 1);
          return json({ error: "AI paused", status: e.httpStatus, created }, 200);
        }
        console.error("draft failed", email, e);
      }
    }
    return json({ candidates: candidates.length, created });
  } finally {
    await db.from("outreach_scan_lock").update({ locked_until: new Date().toISOString() }).eq("id", 1);
  }
});
