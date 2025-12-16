// Email Translation Service - Provides translated email templates for 8 languages

export type SupportedLanguage = 'en' | 'de' | 'de-CH' | 'nl' | 'cs' | 'sv' | 'it' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'de-CH', label: 'Schweizerdeutsch', flag: '🇨🇭' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export type TemplateType = 'friendly' | 'professional' | 'urgent' | 'final';

interface TranslatedTemplate {
  subject: string;
  body: string;
}

type TranslationMap = Record<SupportedLanguage, Record<TemplateType, TranslatedTemplate>>;

const translations: TranslationMap = {
  en: {
    friendly: {
      subject: 'Friendly Reminder: Payment for {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Payment Reminder</h2>
  <p>Dear {companyName},</p>
  <p>We hope this message finds you well. This is a friendly reminder regarding your outstanding payment.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Order Details</h3>
    <p><strong>Company:</strong> {companyName}</p>
    <p><strong>Email:</strong> {clientEmail}</p>
    <p><strong>Phone:</strong> {contactPhone}</p>
    <p><strong>Website:</strong> {website}</p>
    <p><strong>Order Date:</strong> {orderDate}</p>
    <p><strong>Description:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Amount Due:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>If you have already made this payment, please disregard this notice. Should you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.</p>
  
  <p>Thank you for your business!</p>
  
  <p>Best regards,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Payment Notice: Invoice for {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Payment Notice</h2>
  <p>Dear {companyName},</p>
  <p>According to our records, the following payment remains outstanding. Please review the details below and arrange for payment at your earliest convenience.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Invoice Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Company:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Email:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Phone:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Website:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Order Date:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Description:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Amount Due:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Please ensure payment is processed promptly. If payment has already been made, please accept our thanks and disregard this notice.</p>
  
  <p>For any inquiries, please contact our team.</p>
  
  <p>Sincerely,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'URGENT: Payment Required for {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Urgent Payment Required</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Dear {companyName},</p>
    <p><strong>This is an urgent reminder that your payment is now overdue.</strong> Immediate attention is required to avoid any service interruptions.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Outstanding Payment Details</h3>
      <p><strong>Company:</strong> {companyName}</p>
      <p><strong>Email:</strong> {clientEmail}</p>
      <p><strong>Phone:</strong> {contactPhone}</p>
      <p><strong>Website:</strong> {website}</p>
      <p><strong>Order Date:</strong> {orderDate}</p>
      <p><strong>Description:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Amount Due: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Please process this payment immediately. If you are experiencing difficulties, contact us right away to discuss options.</p>
    
    <p>Regards,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'FINAL NOTICE: Immediate Payment Required - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 FINAL PAYMENT NOTICE</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Dear {companyName},</p>
    <p><strong style="color: #d32f2f;">This is your final notice before further action is taken.</strong></p>
    <p>Despite previous reminders, the following payment remains outstanding. Failure to pay immediately may result in service termination and collection proceedings.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">OVERDUE PAYMENT</h3>
      <p><strong>Company:</strong> {companyName}</p>
      <p><strong>Email:</strong> {clientEmail}</p>
      <p><strong>Phone:</strong> {contactPhone}</p>
      <p><strong>Website:</strong> {website}</p>
      <p><strong>Order Date:</strong> {orderDate}</p>
      <p><strong>Description:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>AMOUNT DUE: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>Payment must be received within 48 hours</strong> to avoid further action.</p>
    
    <p>Contact us immediately if there are extenuating circumstances.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
  de: {
    friendly: {
      subject: 'Freundliche Erinnerung: Zahlung für {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Zahlungserinnerung</h2>
  <p>Sehr geehrte/r {companyName},</p>
  <p>wir hoffen, es geht Ihnen gut. Dies ist eine freundliche Erinnerung an Ihre ausstehende Zahlung.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Bestelldetails</h3>
    <p><strong>Firma:</strong> {companyName}</p>
    <p><strong>E-Mail:</strong> {clientEmail}</p>
    <p><strong>Telefon:</strong> {contactPhone}</p>
    <p><strong>Webseite:</strong> {website}</p>
    <p><strong>Bestelldatum:</strong> {orderDate}</p>
    <p><strong>Beschreibung:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Fälliger Betrag:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>Falls Sie diese Zahlung bereits getätigt haben, ignorieren Sie bitte diese Nachricht. Bei Fragen oder für Zahlungsvereinbarungen kontaktieren Sie uns gerne.</p>
  
  <p>Vielen Dank für Ihr Vertrauen!</p>
  
  <p>Mit freundlichen Grüßen,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Zahlungshinweis: Rechnung für {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Zahlungshinweis</h2>
  <p>Sehr geehrte/r {companyName},</p>
  <p>laut unseren Unterlagen ist die folgende Zahlung noch offen. Bitte überprüfen Sie die Details und veranlassen Sie die Zahlung baldmöglichst.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Rechnungsdetails</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Firma:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">E-Mail:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Telefon:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Webseite:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Bestelldatum:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Beschreibung:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Fälliger Betrag:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Bitte veranlassen Sie die Zahlung zeitnah. Falls bereits bezahlt, betrachten Sie diese Nachricht als gegenstandslos.</p>
  
  <p>Bei Fragen wenden Sie sich bitte an unser Team.</p>
  
  <p>Mit freundlichen Grüßen,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'DRINGEND: Zahlung erforderlich für {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Dringende Zahlungsaufforderung</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Sehr geehrte/r {companyName},</p>
    <p><strong>Dies ist eine dringende Erinnerung, dass Ihre Zahlung überfällig ist.</strong> Sofortige Aufmerksamkeit ist erforderlich, um Serviceunterbrechungen zu vermeiden.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Details zur ausstehenden Zahlung</h3>
      <p><strong>Firma:</strong> {companyName}</p>
      <p><strong>E-Mail:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Webseite:</strong> {website}</p>
      <p><strong>Bestelldatum:</strong> {orderDate}</p>
      <p><strong>Beschreibung:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Fälliger Betrag: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Bitte veranlassen Sie die Zahlung umgehend. Bei Schwierigkeiten kontaktieren Sie uns sofort, um Optionen zu besprechen.</p>
    
    <p>Mit freundlichen Grüßen,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'LETZTE MAHNUNG: Sofortige Zahlung erforderlich - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 LETZTE MAHNUNG</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Sehr geehrte/r {companyName},</p>
    <p><strong style="color: #d32f2f;">Dies ist Ihre letzte Mahnung vor weiteren Maßnahmen.</strong></p>
    <p>Trotz vorheriger Erinnerungen ist die folgende Zahlung weiterhin ausstehend. Bei Nichtzahlung können Diensteinstellung und Inkassoverfahren eingeleitet werden.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">ÜBERFÄLLIGE ZAHLUNG</h3>
      <p><strong>Firma:</strong> {companyName}</p>
      <p><strong>E-Mail:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Webseite:</strong> {website}</p>
      <p><strong>Bestelldatum:</strong> {orderDate}</p>
      <p><strong>Beschreibung:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>FÄLLIGER BETRAG: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>Die Zahlung muss innerhalb von 48 Stunden eingehen</strong>, um weitere Maßnahmen zu vermeiden.</p>
    
    <p>Kontaktieren Sie uns umgehend bei besonderen Umständen.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
  'de-CH': {
    friendly: {
      subject: 'Fründlichi Erinnerig: Zahlig für {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Zahligserinnerig</h2>
  <p>Grüezi {companyName},</p>
  <p>Mir hoffed, es gaht Ihne guet. Das isch e fründlichi Erinnerig a Ihri uusstehendi Zahlig.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Bstelligsdetails</h3>
    <p><strong>Firma:</strong> {companyName}</p>
    <p><strong>E-Mail:</strong> {clientEmail}</p>
    <p><strong>Telefon:</strong> {contactPhone}</p>
    <p><strong>Websyte:</strong> {website}</p>
    <p><strong>Bstelldatum:</strong> {orderDate}</p>
    <p><strong>Beschrybig:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Fällige Betrag:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>Falls Sie d'Zahlig scho gmacht händ, ignoriereds bitte die Nachricht. Bi Frage oder für Zahligsvereinbarige chömed Sie gärn uf üs zue.</p>
  
  <p>Merci vilmal für Ihres Vertraue!</p>
  
  <p>Fründlichi Grüess,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Zahligshinwys: Rechnig für {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Zahligshinwys</h2>
  <p>Grüezi {companyName},</p>
  <p>Lut üsne Unterlag isch d'folgende Zahlig no offe. Bitte überprüefed Sie d'Details und veranlassed Sie d'Zahlig so schnäll wie möglich.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Rechnigdetails</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Firma:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">E-Mail:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Telefon:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Websyte:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Bstelldatum:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Beschrybig:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Fällige Betrag:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Bitte veranlassed Sie d'Zahlig zytnah. Falls scho zahlt, betrachted Sie die Nachricht als gegestandslos.</p>
  
  <p>Bi Frage wänded Sie sich bitte a üses Team.</p>
  
  <p>Fründlichi Grüess,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'DRINGEND: Zahlig erforderlich für {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Dringendi Zahligsufförderig</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Grüezi {companyName},</p>
    <p><strong>Das isch e dringendi Erinnerig, dass Ihri Zahlig überfällig isch.</strong> Sofotigi Ufmerksamkeit isch erforderlich, zum Serviceunterbrüch z'vermyde.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Details zur uusstehende Zahlig</h3>
      <p><strong>Firma:</strong> {companyName}</p>
      <p><strong>E-Mail:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Websyte:</strong> {website}</p>
      <p><strong>Bstelldatum:</strong> {orderDate}</p>
      <p><strong>Beschrybig:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Fällige Betrag: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Bitte veranlassed Sie d'Zahlig sofort. Bi Schwierigkeite kontaktiereds üs sofort, zum Optione z'bespräche.</p>
    
    <p>Fründlichi Grüess,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'LETSCHTI MAHNIG: Sofotigi Zahlig erforderlich - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 LETSCHTI MAHNIG</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Grüezi {companyName},</p>
    <p><strong style="color: #d32f2f;">Das isch Ihri letschti Mahnig vor witere Massnahme.</strong></p>
    <p>Trotz vorherige Erinnerige isch d'folgende Zahlig immer no uusstehend. Bi Nichtzahlig chönd Dienschtystellig und Inkassoverfahre ygeleitet werde.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">ÜBERFÄLLIGI ZAHLIG</h3>
      <p><strong>Firma:</strong> {companyName}</p>
      <p><strong>E-Mail:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Websyte:</strong> {website}</p>
      <p><strong>Bstelldatum:</strong> {orderDate}</p>
      <p><strong>Beschrybig:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>FÄLLIGE BETRAG: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>D'Zahlig mues innerhalb vo 48 Stund ygah</strong>, zum witeri Massnahme z'vermyde.</p>
    
    <p>Kontaktiereds üs sofort bi bsondere Umständ.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
  nl: {
    friendly: {
      subject: 'Vriendelijke herinnering: Betaling voor {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Betalingsherinnering</h2>
  <p>Beste {companyName},</p>
  <p>We hopen dat het goed met u gaat. Dit is een vriendelijke herinnering aan uw openstaande betaling.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Bestelgegevens</h3>
    <p><strong>Bedrijf:</strong> {companyName}</p>
    <p><strong>E-mail:</strong> {clientEmail}</p>
    <p><strong>Telefoon:</strong> {contactPhone}</p>
    <p><strong>Website:</strong> {website}</p>
    <p><strong>Besteldatum:</strong> {orderDate}</p>
    <p><strong>Omschrijving:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Verschuldigd bedrag:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>Als u deze betaling al heeft gedaan, kunt u dit bericht negeren. Heeft u vragen of wilt u een betalingsregeling bespreken, neem dan gerust contact met ons op.</p>
  
  <p>Bedankt voor uw vertrouwen!</p>
  
  <p>Met vriendelijke groet,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Betalingsbericht: Factuur voor {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Betalingsbericht</h2>
  <p>Beste {companyName},</p>
  <p>Volgens onze administratie staat de volgende betaling nog open. Controleer de gegevens en regel de betaling zo spoedig mogelijk.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Factuurgegevens</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Bedrijf:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">E-mail:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Telefoon:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Website:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Besteldatum:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Omschrijving:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Verschuldigd bedrag:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Zorg ervoor dat de betaling spoedig wordt verwerkt. Als de betaling al is gedaan, beschouw dit bericht dan als niet verzonden.</p>
  
  <p>Voor vragen kunt u contact opnemen met ons team.</p>
  
  <p>Met vriendelijke groet,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'DRINGEND: Betaling vereist voor {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Dringende Betalingsverzoek</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Beste {companyName},</p>
    <p><strong>Dit is een dringende herinnering dat uw betaling achterstallig is.</strong> Onmiddellijke aandacht is vereist om serviceonderbrekingen te voorkomen.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Openstaande Betalingsgegevens</h3>
      <p><strong>Bedrijf:</strong> {companyName}</p>
      <p><strong>E-mail:</strong> {clientEmail}</p>
      <p><strong>Telefoon:</strong> {contactPhone}</p>
      <p><strong>Website:</strong> {website}</p>
      <p><strong>Besteldatum:</strong> {orderDate}</p>
      <p><strong>Omschrijving:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Verschuldigd bedrag: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Verwerk deze betaling onmiddellijk. Als u problemen ondervindt, neem dan direct contact met ons op om opties te bespreken.</p>
    
    <p>Met vriendelijke groet,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'LAATSTE AANMANING: Onmiddellijke betaling vereist - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 LAATSTE AANMANING</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Beste {companyName},</p>
    <p><strong style="color: #d32f2f;">Dit is uw laatste aanmaning voordat verdere actie wordt ondernomen.</strong></p>
    <p>Ondanks eerdere herinneringen staat de volgende betaling nog steeds open. Bij niet-betaling kan de dienstverlening worden beëindigd en kunnen incassoprocedures worden gestart.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">ACHTERSTALLIGE BETALING</h3>
      <p><strong>Bedrijf:</strong> {companyName}</p>
      <p><strong>E-mail:</strong> {clientEmail}</p>
      <p><strong>Telefoon:</strong> {contactPhone}</p>
      <p><strong>Website:</strong> {website}</p>
      <p><strong>Besteldatum:</strong> {orderDate}</p>
      <p><strong>Omschrijving:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>VERSCHULDIGD BEDRAG: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>Betaling moet binnen 48 uur worden ontvangen</strong> om verdere actie te voorkomen.</p>
    
    <p>Neem onmiddellijk contact met ons op als er verzachtende omstandigheden zijn.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
  cs: {
    friendly: {
      subject: 'Přátelská připomínka: Platba za {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Připomínka platby</h2>
  <p>Vážený/á {companyName},</p>
  <p>doufáme, že se vám daří dobře. Toto je přátelská připomínka vaší neuhrazené platby.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Detaily objednávky</h3>
    <p><strong>Společnost:</strong> {companyName}</p>
    <p><strong>E-mail:</strong> {clientEmail}</p>
    <p><strong>Telefon:</strong> {contactPhone}</p>
    <p><strong>Web:</strong> {website}</p>
    <p><strong>Datum objednávky:</strong> {orderDate}</p>
    <p><strong>Popis:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Dlužná částka:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>Pokud jste tuto platbu již provedli, ignorujte prosím toto oznámení. V případě dotazů nebo pro dohodnutí splátkového kalendáře nás neváhejte kontaktovat.</p>
  
  <p>Děkujeme za vaši důvěru!</p>
  
  <p>S pozdravem,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Oznámení o platbě: Faktura pro {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Oznámení o platbě</h2>
  <p>Vážený/á {companyName},</p>
  <p>podle našich záznamů zůstává následující platba neuhrazena. Prosím zkontrolujte níže uvedené údaje a zajistěte platbu co nejdříve.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Detaily faktury</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Společnost:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">E-mail:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Telefon:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Web:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Datum objednávky:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Popis:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Dlužná částka:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Zajistěte prosím včasné provedení platby. Pokud byla platba již provedena, považujte toto oznámení za bezpředmětné.</p>
  
  <p>V případě dotazů kontaktujte náš tým.</p>
  
  <p>S pozdravem,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'NALÉHAVÉ: Požadována platba za {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Naléhavá výzva k platbě</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Vážený/á {companyName},</p>
    <p><strong>Toto je naléhavá připomínka, že vaše platba je po splatnosti.</strong> Je vyžadována okamžitá pozornost, aby nedošlo k přerušení služeb.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Detaily neuhrazené platby</h3>
      <p><strong>Společnost:</strong> {companyName}</p>
      <p><strong>E-mail:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Web:</strong> {website}</p>
      <p><strong>Datum objednávky:</strong> {orderDate}</p>
      <p><strong>Popis:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Dlužná částka: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Proveďte prosím tuto platbu okamžitě. Pokud máte potíže, kontaktujte nás ihned pro projednání možností.</p>
    
    <p>S pozdravem,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'POSLEDNÍ UPOMÍNKA: Okamžitá platba požadována - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 POSLEDNÍ UPOMÍNKA</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Vážený/á {companyName},</p>
    <p><strong style="color: #d32f2f;">Toto je vaše poslední upomínka před dalšími kroky.</strong></p>
    <p>Přes předchozí připomínky zůstává následující platba neuhrazena. Neplacení může vést k ukončení služeb a zahájení inkasního řízení.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">PLATBA PO SPLATNOSTI</h3>
      <p><strong>Společnost:</strong> {companyName}</p>
      <p><strong>E-mail:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Web:</strong> {website}</p>
      <p><strong>Datum objednávky:</strong> {orderDate}</p>
      <p><strong>Popis:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>DLUŽNÁ ČÁSTKA: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>Platba musí být přijata do 48 hodin</strong>, aby se předešlo dalším krokům.</p>
    
    <p>Kontaktujte nás okamžitě, pokud existují polehčující okolnosti.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
  sv: {
    friendly: {
      subject: 'Vänlig påminnelse: Betalning för {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Betalningspåminnelse</h2>
  <p>Hej {companyName},</p>
  <p>Vi hoppas att allt är bra med er. Detta är en vänlig påminnelse om er utestående betalning.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Orderdetaljer</h3>
    <p><strong>Företag:</strong> {companyName}</p>
    <p><strong>E-post:</strong> {clientEmail}</p>
    <p><strong>Telefon:</strong> {contactPhone}</p>
    <p><strong>Webbplats:</strong> {website}</p>
    <p><strong>Orderdatum:</strong> {orderDate}</p>
    <p><strong>Beskrivning:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Belopp att betala:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>Om ni redan har gjort denna betalning, vänligen bortse från detta meddelande. Vid frågor eller för att diskutera betalningsarrangemang, tveka inte att kontakta oss.</p>
  
  <p>Tack för ert förtroende!</p>
  
  <p>Med vänliga hälsningar,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Betalningsmeddelande: Faktura för {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Betalningsmeddelande</h2>
  <p>Hej {companyName},</p>
  <p>Enligt våra uppgifter är följande betalning fortfarande utestående. Vänligen granska detaljerna nedan och ordna betalning snarast möjligt.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Fakturadetaljer</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Företag:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">E-post:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Telefon:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Webbplats:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Orderdatum:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Beskrivning:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Belopp att betala:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Vänligen se till att betalningen behandlas omgående. Om betalning redan har gjorts, vänligen bortse från detta meddelande.</p>
  
  <p>Vid frågor, vänligen kontakta vårt team.</p>
  
  <p>Med vänliga hälsningar,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'BRÅDSKANDE: Betalning krävs för {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Brådskande Betalningskrav</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Hej {companyName},</p>
    <p><strong>Detta är en brådskande påminnelse om att er betalning är förfallen.</strong> Omedelbar uppmärksamhet krävs för att undvika avbrott i tjänsten.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Utestående Betalningsdetaljer</h3>
      <p><strong>Företag:</strong> {companyName}</p>
      <p><strong>E-post:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Webbplats:</strong> {website}</p>
      <p><strong>Orderdatum:</strong> {orderDate}</p>
      <p><strong>Beskrivning:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Belopp att betala: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Vänligen behandla denna betalning omedelbart. Om ni har svårigheter, kontakta oss direkt för att diskutera alternativ.</p>
    
    <p>Med vänliga hälsningar,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'SLUTLIG PÅMINNELSE: Omedelbar betalning krävs - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 SLUTLIG PÅMINNELSE</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Hej {companyName},</p>
    <p><strong style="color: #d32f2f;">Detta är er slutliga påminnelse innan ytterligare åtgärder vidtas.</strong></p>
    <p>Trots tidigare påminnelser är följande betalning fortfarande utestående. Underlåtenhet att betala kan resultera i uppsägning av tjänsten och inkassoförfarande.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">FÖRFALLEN BETALNING</h3>
      <p><strong>Företag:</strong> {companyName}</p>
      <p><strong>E-post:</strong> {clientEmail}</p>
      <p><strong>Telefon:</strong> {contactPhone}</p>
      <p><strong>Webbplats:</strong> {website}</p>
      <p><strong>Orderdatum:</strong> {orderDate}</p>
      <p><strong>Beskrivning:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>BELOPP ATT BETALA: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>Betalning måste mottas inom 48 timmar</strong> för att undvika ytterligare åtgärder.</p>
    
    <p>Kontakta oss omedelbart om det finns förmildrande omständigheter.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
  it: {
    friendly: {
      subject: 'Promemoria amichevole: Pagamento per {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Promemoria di pagamento</h2>
  <p>Gentile {companyName},</p>
  <p>Speriamo che stiate bene. Questo è un promemoria amichevole riguardo al vostro pagamento in sospeso.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Dettagli dell'ordine</h3>
    <p><strong>Azienda:</strong> {companyName}</p>
    <p><strong>Email:</strong> {clientEmail}</p>
    <p><strong>Telefono:</strong> {contactPhone}</p>
    <p><strong>Sito web:</strong> {website}</p>
    <p><strong>Data ordine:</strong> {orderDate}</p>
    <p><strong>Descrizione:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Importo dovuto:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>Se avete già effettuato questo pagamento, vi preghiamo di ignorare questo avviso. Per domande o per discutere accordi di pagamento, non esitate a contattarci.</p>
  
  <p>Grazie per la vostra fiducia!</p>
  
  <p>Cordiali saluti,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Avviso di pagamento: Fattura per {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Avviso di pagamento</h2>
  <p>Gentile {companyName},</p>
  <p>Secondo i nostri registri, il seguente pagamento risulta ancora in sospeso. Vi preghiamo di verificare i dettagli sottostanti e provvedere al pagamento al più presto.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Dettagli fattura</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Azienda:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Email:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Telefono:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Sito web:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Data ordine:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Descrizione:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Importo dovuto:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Vi preghiamo di provvedere al pagamento tempestivamente. Se il pagamento è già stato effettuato, considerate nullo questo avviso.</p>
  
  <p>Per qualsiasi domanda, contattate il nostro team.</p>
  
  <p>Cordiali saluti,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'URGENTE: Pagamento richiesto per {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Richiesta di Pagamento Urgente</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Gentile {companyName},</p>
    <p><strong>Questo è un promemoria urgente che il vostro pagamento è scaduto.</strong> È richiesta attenzione immediata per evitare interruzioni del servizio.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Dettagli Pagamento in Sospeso</h3>
      <p><strong>Azienda:</strong> {companyName}</p>
      <p><strong>Email:</strong> {clientEmail}</p>
      <p><strong>Telefono:</strong> {contactPhone}</p>
      <p><strong>Sito web:</strong> {website}</p>
      <p><strong>Data ordine:</strong> {orderDate}</p>
      <p><strong>Descrizione:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Importo dovuto: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Vi preghiamo di elaborare questo pagamento immediatamente. Se avete difficoltà, contattateci subito per discutere le opzioni.</p>
    
    <p>Cordiali saluti,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'AVVISO FINALE: Pagamento immediato richiesto - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 AVVISO FINALE DI PAGAMENTO</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Gentile {companyName},</p>
    <p><strong style="color: #d32f2f;">Questo è il vostro avviso finale prima di ulteriori azioni.</strong></p>
    <p>Nonostante i precedenti promemoria, il seguente pagamento rimane in sospeso. Il mancato pagamento potrebbe comportare la sospensione del servizio e procedure di recupero crediti.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">PAGAMENTO SCADUTO</h3>
      <p><strong>Azienda:</strong> {companyName}</p>
      <p><strong>Email:</strong> {clientEmail}</p>
      <p><strong>Telefono:</strong> {contactPhone}</p>
      <p><strong>Sito web:</strong> {website}</p>
      <p><strong>Data ordine:</strong> {orderDate}</p>
      <p><strong>Descrizione:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>IMPORTO DOVUTO: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>Il pagamento deve essere ricevuto entro 48 ore</strong> per evitare ulteriori azioni.</p>
    
    <p>Contattateci immediatamente se ci sono circostanze attenuanti.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
  fr: {
    friendly: {
      subject: 'Rappel amical: Paiement pour {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1976d2;">Rappel de paiement</h2>
  <p>Cher/Chère {companyName},</p>
  <p>Nous espérons que vous allez bien. Ceci est un rappel amical concernant votre paiement en attente.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Détails de la commande</h3>
    <p><strong>Entreprise:</strong> {companyName}</p>
    <p><strong>Email:</strong> {clientEmail}</p>
    <p><strong>Téléphone:</strong> {contactPhone}</p>
    <p><strong>Site web:</strong> {website}</p>
    <p><strong>Date de commande:</strong> {orderDate}</p>
    <p><strong>Description:</strong> {orderDescription}</p>
    <p style="font-size: 18px; color: #1976d2;"><strong>Montant dû:</strong> {amount}</p>
  </div>
  
  {customMessage}
  
  <p>Si vous avez déjà effectué ce paiement, veuillez ignorer cet avis. Pour toute question ou pour discuter des modalités de paiement, n'hésitez pas à nous contacter.</p>
  
  <p>Merci pour votre confiance!</p>
  
  <p>Cordialement,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    professional: {
      subject: 'Avis de paiement: Facture pour {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Avis de paiement</h2>
  <p>Cher/Chère {companyName},</p>
  <p>Selon nos dossiers, le paiement suivant reste impayé. Veuillez vérifier les détails ci-dessous et effectuer le paiement dans les meilleurs délais.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Détails de la facture</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 5px 0; color: #666;">Entreprise:</td><td style="padding: 5px 0;"><strong>{companyName}</strong></td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Email:</td><td style="padding: 5px 0;">{clientEmail}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Téléphone:</td><td style="padding: 5px 0;">{contactPhone}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Site web:</td><td style="padding: 5px 0;">{website}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Date de commande:</td><td style="padding: 5px 0;">{orderDate}</td></tr>
      <tr><td style="padding: 5px 0; color: #666;">Description:</td><td style="padding: 5px 0;">{orderDescription}</td></tr>
      <tr><td style="padding: 8px 0; color: #666; font-size: 16px;">Montant dû:</td><td style="padding: 8px 0; font-size: 18px; color: #1976d2;"><strong>{amount}</strong></td></tr>
    </table>
  </div>
  
  {customMessage}
  
  <p>Veuillez vous assurer que le paiement est traité rapidement. Si le paiement a déjà été effectué, veuillez considérer cet avis comme nul.</p>
  
  <p>Pour toute question, veuillez contacter notre équipe.</p>
  
  <p>Cordialement,<br>{teamMemberName}<br>AB Media Team</p>
</div>`,
    },
    urgent: {
      subject: 'URGENT: Paiement requis pour {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">⚠️ Demande de Paiement Urgente</h2>
  </div>
  
  <div style="border: 2px solid #ff9800; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Cher/Chère {companyName},</p>
    <p><strong>Ceci est un rappel urgent que votre paiement est en retard.</strong> Une attention immédiate est requise pour éviter toute interruption de service.</p>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #e65100;">Détails du Paiement en Souffrance</h3>
      <p><strong>Entreprise:</strong> {companyName}</p>
      <p><strong>Email:</strong> {clientEmail}</p>
      <p><strong>Téléphone:</strong> {contactPhone}</p>
      <p><strong>Site web:</strong> {website}</p>
      <p><strong>Date de commande:</strong> {orderDate}</p>
      <p><strong>Description:</strong> {orderDescription}</p>
      <p style="font-size: 20px; color: #e65100;"><strong>Montant dû: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p>Veuillez traiter ce paiement immédiatement. Si vous rencontrez des difficultés, contactez-nous immédiatement pour discuter des options.</p>
    
    <p>Cordialement,<br>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
    final: {
      subject: 'DERNIER AVIS: Paiement immédiat requis - {companyName}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #d32f2f; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">🚨 DERNIER AVIS DE PAIEMENT</h2>
  </div>
  
  <div style="border: 2px solid #d32f2f; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
    <p>Cher/Chère {companyName},</p>
    <p><strong style="color: #d32f2f;">Ceci est votre dernier avis avant que d'autres mesures ne soient prises.</strong></p>
    <p>Malgré les rappels précédents, le paiement suivant reste impayé. Le non-paiement peut entraîner la résiliation du service et des procédures de recouvrement.</p>
    
    <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d32f2f;">
      <h3 style="margin-top: 0; color: #d32f2f;">PAIEMENT EN RETARD</h3>
      <p><strong>Entreprise:</strong> {companyName}</p>
      <p><strong>Email:</strong> {clientEmail}</p>
      <p><strong>Téléphone:</strong> {contactPhone}</p>
      <p><strong>Site web:</strong> {website}</p>
      <p><strong>Date de commande:</strong> {orderDate}</p>
      <p><strong>Description:</strong> {orderDescription}</p>
      <p style="font-size: 22px; color: #d32f2f;"><strong>MONTANT DÛ: {amount}</strong></p>
    </div>
    
    {customMessage}
    
    <p><strong>Le paiement doit être reçu dans les 48 heures</strong> pour éviter d'autres mesures.</p>
    
    <p>Contactez-nous immédiatement s'il existe des circonstances atténuantes.</p>
    
    <p>{teamMemberName}<br>AB Media Team</p>
  </div>
</div>`,
    },
  },
};

// Map template names to template types
const templateNameToType: Record<string, TemplateType> = {
  'Friendly Reminder': 'friendly',
  'Professional Notice': 'professional',
  'Urgent Payment Due': 'urgent',
  'Final Notice': 'final',
};

export const emailTranslationService = {
  /**
   * Get translated email template
   */
  getTranslatedTemplate(
    templateName: string,
    language: SupportedLanguage
  ): TranslatedTemplate | null {
    const templateType = templateNameToType[templateName];
    if (!templateType) {
      // If template name doesn't match predefined ones, return null
      return null;
    }
    
    return translations[language]?.[templateType] || null;
  },

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageOption[] {
    return SUPPORTED_LANGUAGES;
  },

  /**
   * Get language by code
   */
  getLanguageByCode(code: SupportedLanguage): LanguageOption | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  },

  /**
   * Check if a template name has translations available
   */
  hasTranslations(templateName: string): boolean {
    return templateName in templateNameToType;
  },

  /**
   * Get template type from name
   */
  getTemplateType(templateName: string): TemplateType | null {
    return templateNameToType[templateName] || null;
  },
};
