export type PaymentReminderLanguage = 'en' | 'de';

export const PAYMENT_REMINDER_COPY: Record<PaymentReminderLanguage, string> = {
  en: `Hello,

We would like to kindly remind you that we have not yet received your payment!

Your payment means a lot to us as motivation for continuing our work on your project, and it also covers our costs, as we have substantial investments that compel us to remind you about payments.

It would be nice if you could let us know when you were planning to pay our invoice.

Kind regards,
Annalena Klein
Media Marketing Limited
+49 203 7090 7262`,
  de: `Hallo,

Wir möchten Sie freundlich daran erinnern, dass wir Ihre Zahlung noch nicht erhalten haben!

Ihre Zahlung bedeutet uns viel als Motivation für die weitere Arbeit an Ihrem Projekt, und sie deckt auch unsere Kosten, da wir hohe Investitionen haben, aufgrund derer wir gezwungen sind, Sie an die Zahlungen zu erinnern.

Es wäre schön, wenn Sie uns mitteilen würden, wann Sie vorhatten, unsere Rechnung zu bezahlen.

Herzliche Grüße
Annalena Klein
Media Marketing Limited
+49 203 7090 7262`,
};

export const getPaymentReminderHtml = (language: PaymentReminderLanguage) =>
  PAYMENT_REMINDER_COPY[language].split('\n\n').map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('\n');