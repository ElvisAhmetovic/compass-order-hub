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
    ? `<div style="margin-top: 12px;"><a class="${STRIPE_BUTTON_CLASS}" href="${escapeHtml(link!.trim())}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #635bff; color: #ffffff; font-weight: bold; font-size: 13px; padding: 10px 18px; border-radius: 6px; text-decoration: none;">${escapeHtml(getStripeButtonLabel(language))}</a></div>`
    : "";
