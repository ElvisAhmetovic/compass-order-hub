// Optional per-invoice Stripe payment link, shown as a "pay online" button on the preview and PDF.
import { escapeHtml } from "@/utils/sanitize";

export const isValidPaymentLink = (value?: string | null): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export const getStripeButtonLabel = (language?: string) =>
  language === "de" ? "Jetzt online bezahlen mit Stripe" : "Pay online with Stripe";

export const STRIPE_BUTTON_CLASS = "stripe-pay-btn";

export const stripeButtonHtml = (link: string | null | undefined, language?: string) =>
  isValidPaymentLink(link)
    ? `<div style="margin-top: 12px;"><a class="${STRIPE_BUTTON_CLASS}" href="${escapeHtml(link!.trim())}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #635bff; color: #ffffff; font-weight: bold; font-size: 13px; line-height: 16px; padding: 10px 18px 12px; border-radius: 6px; text-decoration: none;">${escapeHtml(getStripeButtonLabel(language))}</a></div>`
    : "";

// Email wording per template language (falls back to English).
const EMAIL_COPY: Record<string, { label: string; hint: string }> = {
  en: { label: "Pay online with Stripe", hint: "You can also pay conveniently online using the button below." },
  de: { label: "Jetzt online bezahlen mit Stripe", hint: "Sie können auch bequem online über den Button unten bezahlen." },
  nl: { label: "Online betalen met Stripe", hint: "U kunt ook eenvoudig online betalen via de knop hieronder." },
  fr: { label: "Payer en ligne avec Stripe", hint: "Vous pouvez également payer facilement en ligne via le bouton ci-dessous." },
  es: { label: "Pagar en línea con Stripe", hint: "También puede pagar cómodamente en línea con el botón de abajo." },
  da: { label: "Betal online med Stripe", hint: "Du kan også nemt betale online via knappen nedenfor." },
  no: { label: "Betal på nett med Stripe", hint: "Du kan også enkelt betale på nett via knappen nedenfor." },
  cs: { label: "Zaplatit online přes Stripe", hint: "Můžete také pohodlně zaplatit online pomocí tlačítka níže." },
  pl: { label: "Zapłać online przez Stripe", hint: "Możesz również wygodnie zapłacić online, korzystając z przycisku poniżej." },
  sv: { label: "Betala online med Stripe", hint: "Du kan också enkelt betala online via knappen nedan." },
  it: { label: "Paga online con Stripe", hint: "Può anche pagare comodamente online tramite il pulsante qui sotto." },
  ru: { label: "Оплатить онлайн через Stripe", hint: "Вы также можете удобно оплатить онлайн с помощью кнопки ниже." },
  uk: { label: "Оплатити онлайн через Stripe", hint: "Ви також можете зручно оплатити онлайн за допомогою кнопки нижче." },
  ro: { label: "Plătiți online cu Stripe", hint: "Puteți plăti comod și online folosind butonul de mai jos." },
  tr: { label: "Stripe ile çevrimiçi öde", hint: "Aşağıdaki düğmeyi kullanarak çevrimiçi olarak da kolayca ödeme yapabilirsiniz." },
  pt: { label: "Pagar online com Stripe", hint: "Também pode pagar comodamente online através do botão abaixo." },
  hu: { label: "Online fizetés Stripe-pal", hint: "Az alábbi gombbal kényelmesen online is fizethet." },
  el: { label: "Πληρωμή online με Stripe", hint: "Μπορείτε επίσης να πληρώσετε εύκολα online μέσω του παρακάτω κουμπιού." },
  bg: { label: "Платете онлайн със Stripe", hint: "Можете също да платите удобно онлайн чрез бутона по-долу." },
  fi: { label: "Maksa verkossa Stripellä", hint: "Voit myös maksaa kätevästi verkossa alla olevalla painikkeella." },
  sk: { label: "Zaplatiť online cez Stripe", hint: "Môžete tiež pohodlne zaplatiť online pomocou tlačidla nižšie." },
  sl: { label: "Plačajte na spletu s Stripe", hint: "Plačate lahko tudi preprosto na spletu prek spodnjega gumba." },
  mk: { label: "Платете онлајн со Stripe", hint: "Можете и удобно да платите онлајн преку копчето подолу." },
};

export const getStripeEmailCopy = (language?: string) => EMAIL_COPY[language || "en"] || EMAIL_COPY.en;

/** Adds the "pay online" hint line to an email message when the invoice has a valid link. */
export const withStripeHint = (message: string, link: string | null | undefined, language?: string) =>
  isValidPaymentLink(link) ? `${message.trimEnd()}\n\n${getStripeEmailCopy(language).hint}` : message;
