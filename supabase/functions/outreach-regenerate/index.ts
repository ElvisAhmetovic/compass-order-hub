import { GatewayError } from "npm:@lovable.dev/ai-gateway";
import { generateDraft, pastServices, topServices, type OutreachOrder } from "../_shared/outreachDraft.ts";
import { loadCatalog, loadClientContext, ORDER_COLS } from "../_shared/outreachContext.ts";
import { admin, corsHeaders, getTeamUser, json } from "../_shared/outreachAuth.ts";

const COLS = ORDER_COLS;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await getTeamUser(req))) return json({ error: "Unauthorized" }, 401);
  const { id, instruction } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return json({ error: "Missing draft id" }, 400);
  const instr = typeof instruction === "string" ? instruction.trim().slice(0, 300) : "";

  const db = admin();
  const { data: draft } = await db.from("outreach_drafts").select("*").eq("id", id).maybeSingle();
  if (!draft || draft.status !== "pending") return json({ error: "Only pending drafts can be rewritten" }, 400);

  const [{ data: mine }, { data: recent }] = await Promise.all([
    db.from("orders").select(COLS).is("deleted_at", null).ilike("contact_email", draft.email).order("created_at", { ascending: false }).limit(20),
    db.from("orders").select(COLS).is("deleted_at", null).order("created_at", { ascending: false }).limit(1000),
  ]);
  const os = (mine ?? []) as OutreachOrder[];
  if (!os.length) return json({ error: "No order history found for this client" }, 400);

  try {
    const catalog = await loadCatalog(db);
    const ctx = await loadClientContext(db, draft.email, os.map((o) => o.id!).filter(Boolean));
    const p = await generateDraft(draft.email, os, catalog.length ? catalog : topServices((recent ?? []) as OutreachOrder[]), {
      instruction: instr || undefined, previous: `${draft.subject}\n\n${draft.body}`,
    }, ctx);
    await db.from("outreach_drafts").update({
      subject: p.subject, body: p.body, reason: p.reason, language: p.language, past_services: pastServices(os),
    }).eq("id", id).eq("status", "pending");
    return json({ ok: true });
  } catch (e) {
    if (e instanceof GatewayError) return json({ error: `AI service unavailable (${e.httpStatus})` }, 502);
    console.error(e);
    return json({ error: "Rewrite failed" }, 500);
  }
});
