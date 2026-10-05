import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(150).optional().default(""),
  service: z.string().trim().max(60).optional().default(""),
  message: z.string().trim().min(10).max(3000),
  language: z.enum(["de", "en"]).default("de"),
  website: z.string().max(0).optional().default(""), // honeypot
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const d = parsed.data;
    const key = Deno.env.get("RESEND_API_KEY_ABMEDIA");
    if (!key) return json({ error: "not_configured" }, 500);
    const resend = new Resend(key);
    const rows = [["Name", d.name], ["E-Mail", d.email], ["Firma", d.company || "—"], ["Leistung", d.service || "—"], ["Sprache", d.language.toUpperCase()]]
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0"><strong>${esc(v)}</strong></td></tr>`).join("");
    const { error } = await resend.emails.send({
      from: "Empria Tech Website <noreply@abm-team.com>",
      to: ["kontakt@empriatech.com"],
      reply_to: d.email,
      subject: `Neue Anfrage über empriatech.com – ${d.name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px"><h2>Neue Kontaktanfrage</h2><table>${rows}</table><h3>Nachricht</h3><p style="white-space:pre-wrap">${esc(d.message)}</p></div>`,
    });
    if (error) { console.error("Resend error", error); return json({ error: "send_failed" }, 502); }
    return json({ ok: true });
  } catch (e) {
    console.error("contact inquiry failed", e);
    return json({ error: "server_error" }, 500);
  }
});
