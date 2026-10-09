import { describe, expect, it } from 'vitest';
import { PAYMENT_REMINDER_COPY, getPaymentReminderHtml } from '../paymentReminderCopy';
import { emailTranslationService } from '../emailTranslationService';

describe('approved payment reminder copy', () => {
  it('preserves the approved English and German text and signature', () => {
    expect(PAYMENT_REMINDER_COPY.en).toContain('It would be nice if you could let us know when you were planning to pay our invoice.');
    expect(PAYMENT_REMINDER_COPY.de).toContain('Es wäre schön, wenn Sie uns mitteilen würden, wann Sie vorhatten, unsere Rechnung zu bezahlen.');
    for (const language of ['en', 'de'] as const) {
      expect(PAYMENT_REMINDER_COPY[language]).toContain('Annalena Klein\nMedia Marketing Limited\n+49 203 7090 7262');
      expect(getPaymentReminderHtml(language)).toContain('Annalena Klein<br>Media Marketing Limited<br>+49 203 7090 7262');
    }
  });

  it('uses the approved body in every built-in order reminder style without changing subjects', () => {
    for (const language of ['en', 'de'] as const) {
      for (const name of ['Friendly Reminder', 'Professional Notice', 'Urgent Payment Due', 'Final Notice']) {
        const translated = emailTranslationService.getTranslatedTemplate(name, language);
        expect(translated?.body).toContain(getPaymentReminderHtml(language));
        expect(translated?.body).toContain('{amount}');
        expect(translated?.subject).toBeTruthy();
        expect(translated?.body).not.toContain('{teamMemberName}');
      }
    }
    expect(emailTranslationService.getTranslatedTemplate('Custom Message', 'de')).toBeNull();
  });
});