// Groups all order descriptions into services with AI, then computes real stats from the orders.
import { GatewayError, generateResponse } from "npm:@lovable.dev/ai-gateway";
import { admin, corsHeaders, getTeamUser, json } from "../_shared/outreachAuth.ts";

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["groups"],
  properties: {
    groups: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["service", "items"],
        properties: {
          service: { type: "string", description: "Short English service name, e.g. 'Google review removal'" },
          items: { type: "array", items: { type: "integer" }, description: "Indexes of the descriptions in this group" },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  if (body?.source !== "cron" && !(await getTeamUser(req))) return json({ error: "Unauthorized" }, 401);
  const db = admin();

  type O = { contact_email: string | null; company_name: string | null; description: string | null; price: number | null; amount: number | null };
  const orders: O[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("orders").select("contact_email, company_name, description, price, amount")
      .is("deleted_at", null).order("created_at", { ascending: false }).range(from, from + 999);
    if (error) return json({ error: error.message }, 500);
    orders.push(...(data as O[]));
    if (!data || data.length < 1000) break;
  }
  const key = (d: string | null) => (d ?? "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
  const counts = new Map<string, number>();
  for (const o of orders) { const k = key(o.description); if (k) counts.set(k, (counts.get(k) ?? 0) + 1); }
  const distinct = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 300).map(([d]) => d);
  if (!distinct.length) return json({ services: 0 });

  let groups: { service: string; items: number[] }[];
  try {
    const res = await generateResponse({
      model: "openai/gpt-6-astra", reasoning: { effort: "low" },
      instructions: "Group these order descriptions of a digital marketing agency into 5-25 services. Use short English service names. Only use what the descriptions show; do not invent services. Every index belongs to exactly one group.",
      input: distinct.map((d, i) => `${i}: ${d}`).join("\n"),
      text: { format: { type: "json_schema", name: "groups", strict: true, schema: SCHEMA } },
    } as never);
    // deno-lint-ignore no-explicit-any
    const out = (res as any).output?.flatMap((i: any) => i.content ?? []).find((c: any) => c.type === "output_text")?.text;
    groups = JSON.parse(out).groups;
  } catch (e) {
    if (e instanceof GatewayError) return json({ error: `AI service unavailable (${e.httpStatus})` }, 502);
    throw e;
  }

  const svcOf = new Map<string, string>();
  for (const g of groups) for (const i of g.items) if (distinct[i]) svcOf.set(distinct[i], g.service.trim().slice(0, 80));

  const stats = new Map<string, { n: number; rev: number; clients: Map<string, number> }>();
  const perClient = new Map<string, Set<string>>();
  let total = 0;
  for (const o of orders) {
    const s = svcOf.get(key(o.description)); if (!s) continue;
    const v = Number(o.price ?? o.amount ?? 0) || 0; total += v;
    const st = stats.get(s) ?? { n: 0, rev: 0, clients: new Map() };
    st.n++; st.rev += v;
    const c = o.company_name || o.contact_email || "?"; st.clients.set(c, (st.clients.get(c) ?? 0) + 1);
    stats.set(s, st);
    const e = (o.contact_email ?? "").toLowerCase();
    if (e) { if (!perClient.has(e)) perClient.set(e, new Set()); perClient.get(e)!.add(s); }
  }
  const rows = [...stats.entries()].map(([s, st]) => {
    const co = new Map<string, number>();
    for (const set of perClient.values()) if (set.has(s)) for (const o of set) if (o !== s) co.set(o, (co.get(o) ?? 0) + 1);
    return {
      service_name: s, order_count: st.n, revenue: Math.round(st.rev * 100) / 100,
      revenue_share: total ? Math.round((st.rev / total) * 1000) / 10 : 0,
      typical_clients: [...st.clients.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c).join(", "),
      bought_with: [...co.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c).join(", "),
      computed_at: new Date().toISOString(),
    };
  });
  const { error } = await db.from("service_insights").upsert(rows, { onConflict: "service_name" });
  if (error) return json({ error: error.message }, 500);
  await db.from("service_insights").delete().lt("computed_at", new Date(Date.now() - 60_000).toISOString()).eq("confirmed", false);
  return json({ services: rows.length, orders: orders.length });
});
