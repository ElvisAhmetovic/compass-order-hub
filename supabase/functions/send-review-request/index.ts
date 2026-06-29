import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Lang = "en" | "de" | "fr" | "it" | "es";

const COPY: Record<Lang, {
  subject: string;
  greeting: (n: string) => string;
  thanks: string;
  ask: string;
  cta: string;
  footer: string;
  ps: string;
}> = {
  en: {
    subject: "Thank you — we'd love your feedback ⭐",
    greeting: (n) => `Hi ${n},`,
    thanks: "Thank you for working with us! We're glad your order has been completed and paid.",
    ask: "If you have a moment, we'd really appreciate a quick Google review — it helps our small team a lot.",
    cta: "Leave a Google review ⭐",
    ps: "It only takes 30 seconds and means the world to us.",
    footer: "AB Media Team",
  },
  de: {
    subject: "Danke — wir freuen uns über Ihr Feedback ⭐",
    greeting: (n) => `Hallo ${n},`,
    thanks: "Vielen Dank für die Zusammenarbeit! Ihre Bestellung ist abgeschlossen und bezahlt.",
    ask: "Wenn Sie kurz Zeit haben, würden wir uns sehr über eine Google-Bewertung freuen — es hilft unserem kleinen Team enorm.",
    cta: "Google-Bewertung abgeben ⭐",
    ps: "Es dauert nur 30 Sekunden und bedeutet uns sehr viel.",
    footer: "AB Media Team",
  },
  fr: {
    subject: "Merci — votre avis compte beaucoup ⭐",
    greeting: (n) => `Bonjour ${n},`,
    thanks: "Merci pour votre confiance ! Votre commande est terminée et payée.",
    ask: "Si vous avez une minute, un avis Google nous aiderait énormément.",
    cta: "Laisser un avis Google ⭐",
    ps: "Cela ne prend que 30 secondes et compte beaucoup pour nous.",
    footer: "AB Media Team",
  },
  it: {
    subject: "Grazie — il suo feedback è prezioso ⭐",
    greeting: (n) => `Salve ${n},`,
    thanks: "Grazie per averci scelto! Il suo ordine è completato e pagato.",
    ask: "Se ha un minuto, una recensione su Google ci aiuterebbe molto.",
    cta: "Lascia una recensione Google ⭐",
    ps: "Bastano 30 secondi e per noi è importantissimo.",
    footer: "AB Media Team",
  },
  es: {
    subject: "Gracias — nos encantaría su opinión ⭐",
    greeting: (n) => `Hola ${n},`,
    thanks: "¡Gracias por confiar en nosotros! Su pedido está completado y pagado.",
    ask: "Si tiene un momento, una reseña en Google nos ayudaría muchísimo.",
    cta: "Dejar una reseña en Google ⭐",
    ps: "Solo toma 30 segundos y significa mucho para nosotros.",
    footer: "AB Media Team",
  },
};

function detectLang(country?: string | null, addr?: string | null): Lang {
  const s = `${country || ""} ${addr || ""}`.toLowerCase();
  if (/(germany|deutschland|österreich|austria|schweiz|switzerland)/.test(s)) return "de";
  if (/(france|belgique|belgium|luxembourg)/.test(s)) return "fr";
  if (/(italia|italy)/.test(s)) return "it";
  if (/(españa|spain|méxico|mexico|argentina|colombia)/.test(s)) return "es";
  return "en";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const placeId = Deno.env.get("GOOGLE_REVIEW_PLACE_ID");
    if (!placeId) {
      console.log("GOOGLE_REVIEW_PLACE_ID not configured, skipping");
      return new Response(JSON.stringify({ success: false, reason: "no_place_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(JSON.stringify({ error: "order_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency guard
    if (order.review_request_sent_at) {
      console.log("Review request already sent for order", orderId);
      return new Response(JSON.stringify({ success: false, reason: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Must be Resolved + Invoice Paid
    if (!order.status_resolved || !order.status_invoice_paid) {
      console.log("Order not Resolved+Paid, skipping", { orderId });
      return new Response(JSON.stringify({ success: false, reason: "status_not_met" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientEmail: string | null = order.contact_email || null;
    if (!recipientEmail) {
      console.log("No contact_email on order, skipping");
      return new Response(JSON.stringify({ success: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort lookup of contact_person + country for personalization
    let contactName = order.company_name || "there";
    let country: string | null = null;
    if (order.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("contact_person, name, country, address")
        .eq("id", order.company_id)
        .maybeSingle();
      if (company?.contact_person) contactName = company.contact_person;
      country = company?.country || null;
    }

    const lang = detectLang(country, order.address);
    const t = COPY[lang];
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

    const html = `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px 36px 8px 36px;">
          <div style="font-size:14px;color:#6b7280;letter-spacing:.04em;text-transform:uppercase;">${t.footer}</div>
          <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#111827;">${t.greeting(contactName)}</h1>
        </td></tr>
        <tr><td style="padding:12px 36px 0 36px;font-size:15px;line-height:1.6;color:#374151;">
          <p style="margin:0 0 14px 0;">${t.thanks}</p>
          <p style="margin:0 0 20px 0;">${t.ask}</p>
        </td></tr>
        <tr><td align="center" style="padding:16px 36px 8px 36px;">
          <a href="${reviewUrl}" target="_blank" style="display:inline-block;background:#1a73e8;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;font-size:16px;">
            ${t.cta}
          </a>
        </td></tr>
        <tr><td align="center" style="padding:6px 36px 28px 36px;font-size:13px;color:#6b7280;">
          ${t.ps}
        </td></tr>
        <tr><td style="padding:18px 36px 26px 36px;border-top:1px solid #eef0f4;font-size:12px;color:#9ca3af;">
          ${t.footer} · <a href="mailto:invoice@team-abmedia.com" style="color:#6b7280;text-decoration:none;">invoice@team-abmedia.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY_ABMEDIA"));
    const sendResp = await resend.emails.send({
      from: "AB Media Team <noreply@abm-team.com>",
      to: [recipientEmail],
      subject: t.subject,
      html,
    });

    if ((sendResp as any)?.error) {
      console.error("Resend error:", (sendResp as any).error);
      return new Response(JSON.stringify({ error: (sendResp as any).error }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark sent (idempotency)
    await supabase
      .from("orders")
      .update({ review_request_sent_at: new Date().toISOString() })
      .eq("id", orderId);

    // Log
    await supabase.from("client_email_logs").insert({
      order_id: orderId,
      sent_to: recipientEmail,
      sent_by_name: "System",
      company_name: order.company_name,
      order_price: order.price,
      currency: order.currency || "EUR",
      custom_message: `Google review request sent (lang=${lang}).`,
    });

    return new Response(JSON.stringify({ success: true, lang }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-review-request error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
