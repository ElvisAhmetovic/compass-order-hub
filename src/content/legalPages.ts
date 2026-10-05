import type { HomepageLanguage } from "@/content/homepage";
import { contactInfo } from "@/config/contactInfo";

export type LegalKey = "impressum" | "datenschutz";
type Section = { heading: string; paragraphs: string[] };
type LegalCopy = { metaTitle: string; metaDescription: string; title: string; updated: string; sections: Section[] };

const soon = { de: "Angaben folgen in Kürze.", en: "Information coming soon." };
const addr = { de: "Düsseldorfer Str. 32\n47051 Duisburg\nDeutschland", en: "Düsseldorfer Str. 32\n47051 Duisburg\nGermany" };
const company = (l: HomepageLanguage) => `${contactInfo.legalName}\n${addr[l]}`;

export const legalPages: Record<LegalKey, { path: string; copy: Record<HomepageLanguage, LegalCopy> }> = {
  impressum: {
    path: "/impressum",
    copy: {
      de: {
        metaTitle: "Impressum — Empria Tech", metaDescription: "Impressum und Anbieterkennzeichnung von Empria Tech (AB TEAM LTD), Duisburg.", title: "Impressum", updated: "Stand: Oktober 2026",
        sections: [
          { heading: "Angaben gemäß § 5 DDG", paragraphs: [company("de"), "Empria Tech ist eine Marke der AB TEAM LTD."] },
          { heading: "Vertreten durch", paragraphs: [soon.de] },
          { heading: "Kontakt", paragraphs: [`E-Mail: ${contactInfo.email}`, `Telefon: ${soon.de}`] },
          { heading: "Registereintrag", paragraphs: [`Registergericht / Registerbehörde: ${soon.de}`, `Registernummer: ${soon.de}`] },
          { heading: "Umsatzsteuer-ID", paragraphs: [`Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${soon.de}`] },
          { heading: "Tätigkeitsbereich", paragraphs: ["Webdesign, Google SEO (Suchmaschinenoptimierung), Digital Marketing und App-Entwicklung für Unternehmen."] },
          { heading: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV", paragraphs: [soon.de] },
          { heading: "EU-Streitschlichtung", paragraphs: ["Die Europäische Kommission stellte eine Plattform zur Online-Streitbeilegung (OS) bereit. Unsere E-Mail-Adresse finden Sie oben im Impressum."] },
          { heading: "Verbraucherstreitbeilegung / Universalschlichtungsstelle", paragraphs: ["Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."] },
          { heading: "Haftung für Inhalte", paragraphs: ["Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Bei Bekanntwerden von Rechtsverletzungen werden wir diese Inhalte umgehend entfernen."] },
          { heading: "Haftung für Links", paragraphs: ["Unser Angebot kann Links zu externen Websites Dritter enthalten, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen."] },
          { heading: "Urheberrecht", paragraphs: ["Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers."] },
        ],
      },
      en: {
        metaTitle: "Legal notice — Empria Tech", metaDescription: "Legal notice (Impressum) of Empria Tech (AB TEAM LTD), Duisburg.", title: "Legal notice (Impressum)", updated: "Last updated: October 2026",
        sections: [
          { heading: "Information pursuant to § 5 DDG", paragraphs: [company("en"), "Empria Tech is a brand of AB TEAM LTD."] },
          { heading: "Represented by", paragraphs: [soon.en] },
          { heading: "Contact", paragraphs: [`Email: ${contactInfo.email}`, `Phone: ${soon.en}`] },
          { heading: "Register entry", paragraphs: [`Register court / authority: ${soon.en}`, `Registration number: ${soon.en}`] },
          { heading: "VAT ID", paragraphs: [`VAT identification number pursuant to § 27a UStG: ${soon.en}`] },
          { heading: "Business activities", paragraphs: ["Web design, Google SEO (search engine optimization), digital marketing and app development for businesses."] },
          { heading: "Responsible for content pursuant to § 18 (2) MStV", paragraphs: [soon.en] },
          { heading: "EU dispute resolution", paragraphs: ["The European Commission provided a platform for online dispute resolution (ODR). Our email address can be found above."] },
          { heading: "Consumer dispute resolution", paragraphs: ["We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board."] },
          { heading: "Liability for content", paragraphs: ["As a service provider, we are responsible for our own content on these pages under general law. We are not obliged to monitor transmitted or stored third-party information. If we become aware of legal violations, we will remove such content immediately."] },
          { heading: "Liability for links", paragraphs: ["Our website may contain links to external third-party websites over whose content we have no control. The respective provider or operator is always responsible for that content. If we become aware of legal violations, we will remove such links immediately."] },
          { heading: "Copyright", paragraphs: ["Content and works created by the site operators are subject to German copyright law. Reproduction, editing, distribution and any kind of use beyond the limits of copyright law require the written consent of the respective author or creator."] },
        ],
      },
    },
  },
  datenschutz: {
    path: "/datenschutz",
    copy: {
      de: {
        metaTitle: "Datenschutzerklärung — Empria Tech", metaDescription: "Datenschutzerklärung von Empria Tech (AB TEAM LTD): Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.", title: "Datenschutzerklärung", updated: "Stand: Oktober 2026",
        sections: [
          { heading: "1. Verantwortlicher", paragraphs: [company("de"), `E-Mail: ${contactInfo.email}`, `Datenschutzbeauftragter: ${soon.de}`] },
          { heading: "2. Allgemeines", paragraphs: ["Wir nehmen den Schutz Ihrer personenbezogenen Daten ernst und verarbeiten diese ausschließlich im Rahmen der gesetzlichen Bestimmungen, insbesondere der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG)."] },
          { heading: "3. Hosting und Server-Logfiles", paragraphs: ["Beim Aufruf unserer Website werden durch den Hosting-Anbieter automatisch Informationen erfasst, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Referrer-URL, Browsertyp und Betriebssystem. Diese Daten dienen der sicheren und stabilen Bereitstellung der Website. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.", `Hosting-Anbieter: ${soon.de}`] },
          { heading: "4. Kontaktformular und E-Mail", paragraphs: ["Wenn Sie uns über das Kontaktformular oder per E-Mail kontaktieren, verarbeiten wir die angegebenen Daten (z. B. Name, E-Mail-Adresse, Unternehmen, Nachricht) ausschließlich zur Bearbeitung Ihrer Anfrage. Die Anfrage wird per E-Mail an uns übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. f DSGVO (berechtigtes Interesse an der Beantwortung). Die Daten werden gelöscht, sobald sie nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten bestehen."] },
          { heading: "5. Kundenkonto und Login", paragraphs: ["Für die Nutzung unseres Kundenbereichs ist eine Registrierung erforderlich. Dabei verarbeiten wir die von Ihnen angegebenen Daten (z. B. Name, E-Mail-Adresse, Passwort in verschlüsselter Form) sowie projekt- und auftragsbezogene Informationen zur Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO. Für die Anmeldung werden technisch notwendige Daten im Browser gespeichert."] },
          { heading: "6. Schriftarten (Google Fonts)", paragraphs: ["Diese Website lädt Schriftarten von Google Fonts (Google Ireland Limited). Dabei wird Ihre IP-Adresse an Google übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (einheitliche Darstellung). Weitere Informationen finden Sie in der Datenschutzerklärung von Google."] },
          { heading: "7. Lokale Speicherung im Browser", paragraphs: ["Wir speichern Ihre gewählte Sprache (Deutsch/Englisch) im lokalen Speicher Ihres Browsers. Es werden keine Tracking- oder Marketing-Cookies eingesetzt. Rechtsgrundlage ist § 25 Abs. 2 TDDDG."] },
          { heading: "8. Weitere eingesetzte Dienste", paragraphs: [soon.de] },
          { heading: "9. SSL- bzw. TLS-Verschlüsselung", paragraphs: ["Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an „https://“ in der Adresszeile Ihres Browsers."] },
          { heading: "10. Speicherdauer", paragraphs: ["Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungsfristen (z. B. handels- und steuerrechtlich) bestehen."] },
          { heading: "11. Ihre Rechte", paragraphs: ["Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen die Verarbeitung (Art. 21). Erteilte Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen.", "Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, z. B. bei der Landesbeauftragten für Datenschutz und Informationsfreiheit Nordrhein-Westfalen.", `Zur Ausübung Ihrer Rechte genügt eine E-Mail an ${contactInfo.email}.`] },
          { heading: "12. Änderungen", paragraphs: ["Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder Änderungen unserer Leistungen abbildet."] },
        ],
      },
      en: {
        metaTitle: "Privacy policy — Empria Tech", metaDescription: "Privacy policy of Empria Tech (AB TEAM LTD): information on the processing of personal data under the GDPR.", title: "Privacy policy", updated: "Last updated: October 2026",
        sections: [
          { heading: "1. Controller", paragraphs: [company("en"), `Email: ${contactInfo.email}`, `Data protection officer: ${soon.en}`] },
          { heading: "2. General", paragraphs: ["We take the protection of your personal data seriously and process it only in accordance with legal requirements, in particular the General Data Protection Regulation (GDPR) and the German Federal Data Protection Act (BDSG)."] },
          { heading: "3. Hosting and server log files", paragraphs: ["When you visit our website, the hosting provider automatically records information sent by your browser: IP address, date and time, page visited, referrer URL, browser type and operating system. This data is used to provide the website securely and reliably. The legal basis is Art. 6(1)(f) GDPR.", `Hosting provider: ${soon.en}`] },
          { heading: "4. Contact form and email", paragraphs: ["If you contact us via the contact form or by email, we process the data you provide (e.g. name, email address, company, message) solely to handle your enquiry. The enquiry is forwarded to us by email. The legal basis is Art. 6(1)(b) GDPR (pre-contractual measures) or Art. 6(1)(f) GDPR (legitimate interest in responding). The data is deleted once it is no longer needed and no statutory retention obligations apply."] },
          { heading: "5. Customer account and login", paragraphs: ["Using our client area requires registration. We process the data you provide (e.g. name, email address, password in encrypted form) as well as project and order information to perform the contract under Art. 6(1)(b) GDPR. Technically necessary data for signing in is stored in your browser."] },
          { heading: "6. Fonts (Google Fonts)", paragraphs: ["This website loads fonts from Google Fonts (Google Ireland Limited). Your IP address is transmitted to Google in the process. The legal basis is Art. 6(1)(f) GDPR (consistent presentation). Further information is available in Google's privacy policy."] },
          { heading: "7. Local browser storage", paragraphs: ["We store your selected language (German/English) in your browser's local storage. No tracking or marketing cookies are used. The legal basis is § 25(2) TDDDG."] },
          { heading: "8. Other services used", paragraphs: [soon.en] },
          { heading: "9. SSL/TLS encryption", paragraphs: ["For security reasons this site uses SSL/TLS encryption. You can recognise an encrypted connection by “https://” in your browser's address bar."] },
          { heading: "10. Retention period", paragraphs: ["Personal data is stored only as long as required for the relevant purpose or as long as statutory retention periods (e.g. commercial and tax law) apply."] },
          { heading: "11. Your rights", paragraphs: ["You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21). You may withdraw any consent at any time with effect for the future.", "You also have the right to lodge a complaint with a data protection supervisory authority, e.g. the State Commissioner for Data Protection and Freedom of Information of North Rhine-Westphalia.", `To exercise your rights, simply email ${contactInfo.email}.`] },
          { heading: "12. Changes", paragraphs: ["We may update this privacy policy so that it always meets current legal requirements or reflects changes to our services."] },
        ],
      },
    },
  },
};
