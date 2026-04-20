import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const formatPrice = (price: number, currency: string) => {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

type OfferStrings = {
  subject: string;          // used for email subject (with " – {company}" appended)
  headerTag: string;        // small label top-left
  headline: string;         // big headline
  priceLabel: string;       // "Price"
  cta: string;              // button label
  greeting: (name: string) => string;
  body1: string;
  body2: string;
  trust: string;
  bestRegards: string;
};

const TRANSLATIONS: Record<string, OfferStrings> = {
  en: {
    subject: 'Your Offer from AB Media Team',
    headerTag: 'Service Offer',
    headline: 'You have received an offer from AB Media Team',
    priceLabel: 'Price',
    cta: 'Confirm Your Order',
    greeting: (n) => `Dear ${n},`,
    body1: 'We are pleased to present you with this offer for our professional services. Please review the details above and click "Confirm Your Order" to proceed.',
    body2: 'If you have any questions, feel free to reach out to us directly.',
    trust: 'Fast response, clear steps, professional documentation – your satisfaction is our priority.',
    bestRegards: 'Best regards,',
  },
  de: {
    subject: 'Ihr Angebot vom AB Media Team',
    headerTag: 'Dienstleistungsangebot',
    headline: 'Sie haben ein Angebot vom AB Media Team erhalten',
    priceLabel: 'Preis',
    cta: 'Bestellung bestätigen',
    greeting: (n) => `Sehr geehrte/r ${n},`,
    body1: 'Wir freuen uns, Ihnen dieses Angebot für unsere professionellen Dienstleistungen zu unterbreiten. Bitte prüfen Sie die obigen Angaben und klicken Sie auf "Bestellung bestätigen", um fortzufahren.',
    body2: 'Bei Fragen können Sie sich jederzeit direkt an uns wenden.',
    trust: 'Schnelle Antwort, klare Schritte, professionelle Dokumentation – Ihre Zufriedenheit hat für uns Priorität.',
    bestRegards: 'Mit freundlichen Grüßen,',
  },
  nl: {
    subject: 'Uw offerte van AB Media Team',
    headerTag: 'Dienstenofferte',
    headline: 'U heeft een offerte ontvangen van AB Media Team',
    priceLabel: 'Prijs',
    cta: 'Bestelling bevestigen',
    greeting: (n) => `Beste ${n},`,
    body1: 'Wij presenteren u graag deze offerte voor onze professionele diensten. Bekijk de bovenstaande details en klik op "Bestelling bevestigen" om door te gaan.',
    body2: 'Heeft u vragen? Neem gerust direct contact met ons op.',
    trust: 'Snelle reactie, duidelijke stappen, professionele documentatie – uw tevredenheid is onze prioriteit.',
    bestRegards: 'Met vriendelijke groet,',
  },
  fr: {
    subject: 'Votre offre de AB Media Team',
    headerTag: 'Offre de service',
    headline: 'Vous avez reçu une offre de AB Media Team',
    priceLabel: 'Prix',
    cta: 'Confirmer votre commande',
    greeting: (n) => `Cher/Chère ${n},`,
    body1: 'Nous avons le plaisir de vous présenter cette offre pour nos services professionnels. Veuillez consulter les détails ci-dessus et cliquer sur "Confirmer votre commande" pour continuer.',
    body2: "Si vous avez des questions, n'hésitez pas à nous contacter directement.",
    trust: 'Réponse rapide, étapes claires, documentation professionnelle – votre satisfaction est notre priorité.',
    bestRegards: 'Cordialement,',
  },
  es: {
    subject: 'Su oferta de AB Media Team',
    headerTag: 'Oferta de servicio',
    headline: 'Ha recibido una oferta de AB Media Team',
    priceLabel: 'Precio',
    cta: 'Confirmar su pedido',
    greeting: (n) => `Estimado/a ${n},`,
    body1: 'Nos complace presentarle esta oferta de nuestros servicios profesionales. Revise los detalles anteriores y haga clic en "Confirmar su pedido" para continuar.',
    body2: 'Si tiene alguna pregunta, no dude en contactarnos directamente.',
    trust: 'Respuesta rápida, pasos claros, documentación profesional – su satisfacción es nuestra prioridad.',
    bestRegards: 'Atentamente,',
  },
  it: {
    subject: 'La sua offerta da AB Media Team',
    headerTag: 'Offerta di servizio',
    headline: 'Ha ricevuto un\'offerta da AB Media Team',
    priceLabel: 'Prezzo',
    cta: 'Conferma il tuo ordine',
    greeting: (n) => `Gentile ${n},`,
    body1: 'Siamo lieti di presentarle questa offerta per i nostri servizi professionali. Esamini i dettagli sopra e clicchi su "Conferma il tuo ordine" per procedere.',
    body2: 'Se ha domande, non esiti a contattarci direttamente.',
    trust: 'Risposta rapida, passaggi chiari, documentazione professionale – la sua soddisfazione è la nostra priorità.',
    bestRegards: 'Cordiali saluti,',
  },
  cs: {
    subject: 'Vaše nabídka od AB Media Team',
    headerTag: 'Nabídka služeb',
    headline: 'Obdrželi jste nabídku od AB Media Team',
    priceLabel: 'Cena',
    cta: 'Potvrdit objednávku',
    greeting: (n) => `Vážený/á ${n},`,
    body1: 'Rádi vám předkládáme tuto nabídku našich profesionálních služeb. Zkontrolujte prosím výše uvedené údaje a klikněte na "Potvrdit objednávku" pro pokračování.',
    body2: 'Máte-li jakékoli dotazy, neváhejte nás přímo kontaktovat.',
    trust: 'Rychlá odpověď, jasné kroky, profesionální dokumentace – vaše spokojenost je naší prioritou.',
    bestRegards: 'S pozdravem,',
  },
  pl: {
    subject: 'Twoja oferta od AB Media Team',
    headerTag: 'Oferta usług',
    headline: 'Otrzymałeś ofertę od AB Media Team',
    priceLabel: 'Cena',
    cta: 'Potwierdź zamówienie',
    greeting: (n) => `Szanowny/a ${n},`,
    body1: 'Z przyjemnością przedstawiamy ofertę naszych profesjonalnych usług. Prosimy o sprawdzenie powyższych szczegółów i kliknięcie "Potwierdź zamówienie", aby kontynuować.',
    body2: 'W razie pytań prosimy o bezpośredni kontakt.',
    trust: 'Szybka odpowiedź, jasne kroki, profesjonalna dokumentacja – Twoje zadowolenie jest naszym priorytetem.',
    bestRegards: 'Z poważaniem,',
  },
  sv: {
    subject: 'Ditt erbjudande från AB Media Team',
    headerTag: 'Tjänsteerbjudande',
    headline: 'Du har fått ett erbjudande från AB Media Team',
    priceLabel: 'Pris',
    cta: 'Bekräfta din beställning',
    greeting: (n) => `Hej ${n},`,
    body1: 'Vi presenterar gärna detta erbjudande för våra professionella tjänster. Granska informationen ovan och klicka på "Bekräfta din beställning" för att fortsätta.',
    body2: 'Om du har några frågor är du välkommen att kontakta oss direkt.',
    trust: 'Snabbt svar, tydliga steg, professionell dokumentation – din nöjdhet är vår prioritet.',
    bestRegards: 'Med vänliga hälsningar,',
  },
  no: {
    subject: 'Ditt tilbud fra AB Media Team',
    headerTag: 'Tjenestetilbud',
    headline: 'Du har mottatt et tilbud fra AB Media Team',
    priceLabel: 'Pris',
    cta: 'Bekreft bestillingen',
    greeting: (n) => `Hei ${n},`,
    body1: 'Vi er glade for å presentere dette tilbudet for våre profesjonelle tjenester. Vennligst gjennomgå detaljene ovenfor og klikk "Bekreft bestillingen" for å fortsette.',
    body2: 'Har du spørsmål, ta gjerne kontakt med oss direkte.',
    trust: 'Rask respons, klare trinn, profesjonell dokumentasjon – din tilfredshet er vår prioritet.',
    bestRegards: 'Med vennlig hilsen,',
  },
  da: {
    subject: 'Dit tilbud fra AB Media Team',
    headerTag: 'Servicetilbud',
    headline: 'Du har modtaget et tilbud fra AB Media Team',
    priceLabel: 'Pris',
    cta: 'Bekræft din bestilling',
    greeting: (n) => `Kære ${n},`,
    body1: 'Vi præsenterer hermed dette tilbud på vores professionelle ydelser. Gennemgå venligst detaljerne ovenfor, og klik på "Bekræft din bestilling" for at fortsætte.',
    body2: 'Har du spørgsmål, er du velkommen til at kontakte os direkte.',
    trust: 'Hurtig respons, klare trin, professionel dokumentation – din tilfredshed er vores prioritet.',
    bestRegards: 'Med venlig hilsen,',
  },
};

const buildOfferEmailHtml = (data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  companyName: string;
  description: string;
  price: number;
  currency: string;
  senderName: string;
  confirmUrl: string;
  language: string;
}) => {
  const formattedPrice = formatPrice(data.price, data.currency);
  const initial = (data.clientName || 'C').charAt(0).toUpperCase();
  const t = TRANSLATIONS[data.language] || TRANSLATIONS.en;

  return `<!DOCTYPE html>
<html lang="${data.language}">
<head><meta charset="UTF-8"><title>${t.subject}</title></head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background-color:#ffffff;">
        <!-- Header -->
        <tr><td style="padding:22px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td align="left" style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#606368;">${t.headerTag}</td>
            <td align="right" style="font-family:Roboto,Arial,sans-serif; font-size:18px; font-weight:bold; color:#1a73e8;">AB Media Team</td>
          </tr></table>
        </td></tr>

        <!-- Stars -->
        <tr><td style="text-align:center; padding:32px 24px 0px;">
          <div style="font-size:48px; color:#fbbc05; letter-spacing:8px; line-height:1;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        </td></tr>

        <!-- Illustration -->
        <tr><td style="text-align:center; padding:8px 24px 0px;">
          <img src="https://www.gstatic.com/gumdrop/files/gmb-migration-transparent-w726-h298-2x.png" width="363" height="auto" border="0" alt="" style="display:inline-block; max-width:363px; width:100%;">
        </td></tr>

        <!-- Headline -->
        <tr><td style="padding:16px 32px 24px; text-align:center;">
          <h1 style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:28px; color:#606368; font-weight:normal; line-height:1.3;">${t.headline}</h1>
        </td></tr>

        <!-- Client Info Card -->
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa; border:1px solid #dadce0; border-radius:12px; padding:24px;">
            <tr>
              <td style="vertical-align:top; width:56px;">
                <div style="width:40px; height:40px; background-color:#1a73e8; color:#ffffff; border-radius:50%; font-size:20px; font-weight:bold; line-height:40px; text-align:center;">${initial}</div>
              </td>
              <td style="padding-left:16px; vertical-align:top;">
                <div style="font-weight:bold; color:#202124; font-size:16px;">${data.clientName}</div>
                <div style="color:#5f6368; font-size:13px; margin-top:4px;">📧 ${data.clientEmail}</div>
                ${data.clientPhone ? `<div style="color:#5f6368; font-size:13px; margin-top:2px;">📞 ${data.clientPhone}</div>` : ''}
                ${data.clientAddress ? `<div style="color:#5f6368; font-size:13px; margin-top:2px;">📍 ${data.clientAddress}</div>` : ''}
                <div style="color:#1a73e8; font-size:18px; font-weight:bold; margin-top:8px;">${t.priceLabel}: ${formattedPrice}</div>
                ${data.description ? `<div style="color:#5f6368; font-size:13px; line-height:1.6; margin-top:8px;">${data.description.replace(/\n/g, '<br>')}</div>` : ''}
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Confirm button -->
        <tr><td style="text-align:center; padding:16px 32px 32px;">
          <a href="${data.confirmUrl || 'https://empriatech.com'}" style="display:inline-block; height:48px; padding:0 28px; border-radius:8px; background:#1a73e8; color:#ffffff; font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; line-height:48px; text-decoration:none; white-space:nowrap; box-shadow:0 1px 2px rgba(60,64,67,.15),0 2px 6px rgba(60,64,67,.10);">${t.cta}</a>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:0 32px 8px; font-family:Roboto,Arial,sans-serif; font-size:14px; color:#606368; line-height:1.7; text-align:center;">
          ${t.greeting(data.clientName)}
        </td></tr>

        <!-- Body text -->
        <tr><td style="padding:8px 32px 16px; font-family:Roboto,Arial,sans-serif; font-size:14px; color:#606368; line-height:1.7; text-align:center;">
          ${t.body1}<br><br>
          ${t.body2}
        </td></tr>

        <!-- Trust text -->
        <tr><td style="padding:0 32px 16px; font-family:Roboto,Arial,sans-serif; font-size:12px; color:#9aa0a6; line-height:1.6; text-align:center;">
          ${t.trust}
        </td></tr>

        <!-- WhatsApp circle button -->
        <tr><td style="text-align:center; padding:0 32px 40px;">
          <a href="https://api.whatsapp.com/send/?phone=4920370907262&text=Hello+AB+Media+Team%2C+I+would+like+to+inquire+about+your+services.&type=phone_number&app_absent=0" style="display:inline-block; width:52px; height:52px; border-radius:50%; background:#25D366; color:#ffffff; font-size:26px; line-height:52px; text-align:center; text-decoration:none; box-shadow:0 1px 2px rgba(60,64,67,.15),0 2px 6px rgba(60,64,67,.10);">&#128172;</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#dadce0; padding:32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="font-family:Roboto,Arial,sans-serif; font-size:10px; color:#515354; line-height:16px;">
              ${t.bestRegards}<br>
              ${data.senderName}, AB Media Team<br><br>
              <a href="https://abmedia-team.com" style="color:#1967d2; text-decoration:none;">abmedia-team.com</a>
            </td>
            <td align="right" style="padding-left:20px; vertical-align:top;">
              <div style="font-family:Roboto,Arial,sans-serif; font-size:14px; font-weight:bold; color:#1a73e8;">AB Media Team</div>
              <div style="font-family:Roboto,Arial,sans-serif; font-size:10px; color:#515354; margin-top:6px;">&copy; ${new Date().getFullYear()} AB Media Team</div>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY_ABMEDIA');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY_ABMEDIA is not configured');
    }

    const body = await req.json();
    const { clientEmail, clientName, clientPhone, clientAddress, companyName, description, price, currency, senderName, offerId, language } = body;

    if (!clientEmail || !clientName || !companyName) {
      throw new Error('Missing required fields: clientEmail, clientName, companyName');
    }

    const lang = (typeof language === 'string' && TRANSLATIONS[language]) ? language : 'en';
    const t = TRANSLATIONS[lang];

    const confirmUrl = offerId
      ? `https://empriatech.com/confirm-offer/${offerId}`
      : 'https://empriatech.com';

    const html = buildOfferEmailHtml({
      clientName,
      clientEmail,
      clientPhone: clientPhone || '',
      clientAddress: clientAddress || '',
      companyName,
      description: description || '',
      price: price || 0,
      currency: currency || 'EUR',
      senderName: senderName || 'AB Media Team',
      confirmUrl,
      language: lang,
    });

    const clientSubject = `${t.subject} – ${companyName}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AB Media Team <noreply@abm-team.com>',
        to: [clientEmail],
        subject: clientSubject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('Offer email sent successfully to:', clientEmail, '(language:', lang, ')');

    // Fire-and-forget: send exact same email to team members in batches
    const teamEmails = [
      'angelina@abmedia-team.com',
      'service@team-abmedia.com',
      'thomas.thomasklein@gmail.com',
      'invoice@team-abmedia.com',
      'jungabmedia@gmail.com',
      'wolfabmedia@gmail.com',
      'marcusabmedia@gmail.com',
      'paulkatz.abmedia@gmail.com',
      'ajosesales36@gmail.com',
      'georgabmediateam@gmail.com',
      'jannes@scoolfinanceedu.com',
    ];

    // Team copy keeps English prefix for internal consistency
    const teamSubject = `[Team Copy] Your Offer from AB Media Team – ${companyName} (${lang.toUpperCase()})`;

    (async () => {
      try {
        for (let i = 0; i < teamEmails.length; i += 2) {
          const batch = teamEmails.slice(i, i + 2);
          await Promise.all(batch.map(email =>
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: 'AB Media Team <noreply@abm-team.com>',
                to: [email],
                subject: teamSubject,
                html,
              }),
            })
          ));
          if (i + 2 < teamEmails.length) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        console.log('Team copy emails sent successfully');
      } catch (err) {
        console.error('Error sending team copy emails:', err);
      }
    })();

    return new Response(JSON.stringify({ success: true, id: result.id, language: lang }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in send-offer-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
