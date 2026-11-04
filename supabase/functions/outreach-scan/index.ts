import { generateResponse, GatewayError } from "npm:@lovable.dev/ai-gateway";
import { admin, corsHeaders, getTeamUser, json } from "../_shared/outreachAuth.ts";
import { COOLDOWN_DAYS, inCooldown, isInactive, SCAN_BATCH } from "../_shared/outreachRules.ts";

type Order = { contact_email: string | null; company_name: string | null; company_address: string | null; description: string | null; price: number | null; amount: number | null; currency: string | null; created_at: string; contact_name: string | null };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "subject", "body", "reason"],
  properties: {
    language: { type: "string", description: "ISO 639-1 code of the email language" },
    subject: { type: "string" },
    body: { type: "string", description: "Plain-text email body with greeting and sign-off, paragraphs separated by blank lines" },
    reason: { type: "string", description: "One short English sentence explaining why this client was picked and what is suggested" },
  },
};

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
        .select("contact_email, company_name, company_address, description, price, amount, currency, created_at, contact_name")
        .is("deleted_at", null).not("contact_email", "is", null)
        .order("created_at", { ascending: false }).range(from, from + 999);
      if (error) throw error;
      orders.push(...(data as Order[]));
      if (!data || data.length < 1000) break;
    }

    // Our services = most common order descriptions (grounding, no invented services)
    const svcCount = new Map<string, number>();
    for (const o of orders) {
      const d = (o.description || "").trim().slice(0, 80);
      if (d) svcCount.set(d, (svcCount.get(d) || 0) + 1);
    }
    const ourServices = [...svcCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([d]) => d);

    const byEmail = new Map<string, Order[]>();
    for (const o of orders) {
      const e = o.contact_email!.trim().toLowerCase();
      if (!e.includes("@")) continue;
      if (!byEmail.has(e)) byEmail.set(e, []);
      byEmail.get(e)!.push(o);
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
      const history = os.slice(0, 10).map((o) =>
        `- ${o.created_at.slice(0, 10)}: ${(o.description || "service").slice(0, 150)} (${o.price ?? o.amount ?? "?"} ${o.currency || "EUR"})`).join("\n");
      const prompt = `Client: ${os[0].company_name || ""}\nContact person: ${os[0].contact_name || "unknown"}\nEmail: ${email}\nAddress: ${os[0].company_address || "unknown"}\nLast order: ${os[0].created_at.slice(0, 10)}\nOrder history (newest first):\n${history}\n\nServices our company offers (from real orders):\n${ourServices.map((s) => `- ${s}`).join("\n")}`;
      try {
        const res = await generateResponse({
          model: "openai/gpt-6-astra",
          reasoning: { effort: "low" },
          instructions: `You write short, friendly re-engagement emails for the digital marketing agency "Media Marketing" (never write LTD or Limited). The client has not ordered for a while. Write in the client's language, inferred from address/country/email domain (German if unclear). Mention the services they used before and suggest 1-2 related services ONLY from the provided list. Never invent prices, discounts, deadlines, guarantees or promises. Ask if they need anything. Keep it under 150 words. Sign off with "Annalena Klein\nMedia Marketing". Do not include an unsubscribe line.`,
          input: prompt,
          text: { format: { type: "json_schema", name: "offer", strict: true, schema: SCHEMA } },
        } as never);
        // deno-lint-ignore no-explicit-any
        const out = (res as any).output?.flatMap((i: any) => i.content ?? []).find((c: any) => c.type === "output_text")?.text;
        const parsed = JSON.parse(out);
        const { error } = await db.from("outreach_drafts").insert({
          email, company_name: os[0].company_name, language: parsed.language, subject: parsed.subject,
          body: parsed.body, reason: parsed.reason, last_order_at: os[0].created_at,
          past_services: os.slice(0, 5).map((o) => (o.description || "").slice(0, 60)).join("; "),
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
