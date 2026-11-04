import { generateResponse } from "npm:@lovable.dev/ai-gateway";

export type OutreachOrder = { id?: string; contact_email: string | null; company_name: string | null; company_address: string | null; description: string | null; price: number | null; amount: number | null; currency: string | null; created_at: string; contact_name: string | null };

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

const INSTRUCTIONS = `You write short, friendly re-engagement emails for the digital marketing agency "Media Marketing" (never write LTD or Limited). The client has not ordered for a while. Write in the client's language, inferred from address/country/email domain (German if unclear). Mention the services they used before and suggest 1-2 related services ONLY from the provided list. Never invent prices, discounts, deadlines, guarantees or promises. Ask if they need anything. Keep it under 150 words. Sign off with "Annalena Klein\nMedia Marketing". Do not include an unsubscribe line.`;

export function topServices(orders: OutreachOrder[]): string[] {
  const c = new Map<string, number>();
  for (const o of orders) {
    const d = (o.description || "").trim().slice(0, 80);
    if (d) c.set(d, (c.get(d) || 0) + 1);
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([d]) => d);
}

/** os = this client's orders, newest first. */
export async function generateDraft(email: string, os: OutreachOrder[], ourServices: string[], extra?: { instruction?: string; previous?: string }) {
  const history = os.slice(0, 10).map((o) =>
    `- ${o.created_at.slice(0, 10)}: ${(o.description || "service").slice(0, 150)} (${o.price ?? o.amount ?? "?"} ${o.currency || "EUR"})`).join("\n");
  let input = `Client: ${os[0].company_name || ""}\nContact person: ${os[0].contact_name || "unknown"}\nEmail: ${email}\nAddress: ${os[0].company_address || "unknown"}\nLast order: ${os[0].created_at.slice(0, 10)}\nOrder history (newest first):\n${history}\n\nServices our company offers (from real orders):\n${ourServices.map((s) => `- ${s}`).join("\n")}`;
  if (extra?.previous) input += `\n\nPrevious draft (rewrite it, do not repeat it word for word):\n${extra.previous}`;
  if (extra?.instruction) input += `\n\nReviewer's instruction for the rewrite (follow it unless it breaks the rules above): ${extra.instruction}`;
  const res = await generateResponse({
    model: "openai/gpt-6-astra",
    reasoning: { effort: "low" },
    instructions: INSTRUCTIONS,
    input,
    text: { format: { type: "json_schema", name: "offer", strict: true, schema: SCHEMA } },
  } as never);
  // deno-lint-ignore no-explicit-any
  const out = (res as any).output?.flatMap((i: any) => i.content ?? []).find((c: any) => c.type === "output_text")?.text;
  return JSON.parse(out) as { language: string; subject: string; body: string; reason: string };
}

export const pastServices = (os: OutreachOrder[]) => os.slice(0, 5).map((o) => (o.description || "").slice(0, 60)).join("; ");
