import { Helmet } from "react-helmet-async";
import { Building2, Clock, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/public/PublicSiteChrome";
import { PublicContactForm } from "@/components/public/PublicContactForm";
import { usePublicLanguage } from "@/hooks/usePublicLanguage";
import { contactInfo, publicAddress } from "@/config/contactInfo";

const copy = {
  de: {
    title: "Kontakt — Empria Tech",
    description: "Kontaktieren Sie Empria Tech für Webdesign, Google SEO und Digital Marketing. Wir antworten in der Regel innerhalb eines Werktags.",
    eyebrow: "Kontakt", h1: "Lassen Sie uns über Ihr Projekt sprechen",
    intro: "Erzählen Sie uns kurz, worum es geht – neue Website, bessere Google-Sichtbarkeit oder mehr Anfragen über digitale Kanäle. Wir melden uns persönlich bei Ihnen.",
    direct: "Direkter Kontakt", address: "Adresse", phone: "Telefon", companyNumber: "Unternehmensnummer", social: "Social Media", response: "Antwortzeit", responseText: "In der Regel innerhalb eines Werktags",
  },
  en: {
    title: "Contact — Empria Tech",
    description: "Contact Empria Tech for web design, Google SEO and digital marketing. We usually reply within one business day.",
    eyebrow: "Contact", h1: "Let's talk about your project",
    intro: "Tell us briefly what you need – a new website, better Google visibility or more leads from digital channels. We will get back to you personally.",
    direct: "Direct contact", address: "Address", phone: "Phone", companyNumber: "Company number", social: "Social media", response: "Response time", responseText: "Usually within one business day",
  },
};

const ContactPage = () => {
  const { language, setLanguage } = usePublicLanguage();
  const t = copy[language];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <html lang={language} />
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <link rel="canonical" href="https://empriatech.com/kontakt" />
        <meta property="og:title" content={t.title} />
        <meta property="og:description" content={t.description} />
        <meta property="og:url" content="https://empriatech.com/kontakt" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "ContactPage", name: t.title, url: "https://empriatech.com/kontakt", about: { "@type": "Organization", name: "Empria Tech", legalName: contactInfo.legalName, identifier: contactInfo.companyNumber, email: contactInfo.email, address: { "@type": "PostalAddress", streetAddress: "Monomark House, 27 Old Gloucester Street", addressLocality: "London", postalCode: "WC1N 3AX", addressCountry: "GB" }, ...(contactInfo.phone && { telephone: contactInfo.phone }), ...(contactInfo.social.length && { sameAs: contactInfo.social.map((s) => s.url) }) } })}</script>
      </Helmet>
      <PublicHeader language={language} onLanguageChange={setLanguage} />
      <main className="pt-20">
        <section className="bg-primary px-5 py-20 text-primary-foreground lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">{t.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-6xl">{t.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/75">{t.intro}</p>
          </div>
        </section>
        <section className="px-5 py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.5fr_1fr]">
            <PublicContactForm language={language} className="rounded-lg border bg-card p-6 shadow-sm sm:p-8" />
            <aside className="space-y-6">
              <h2 className="font-heading text-2xl font-bold">{t.direct}</h2>
              <Info icon={Mail} label={t.email}><a className="hover:text-primary" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></Info>
              {contactInfo.phone && <Info icon={Phone} label={t.phone}><a className="hover:text-primary" href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}>{contactInfo.phone}</a></Info>}
              <Info icon={Building2} label={t.companyNumber}>{contactInfo.companyNumber}</Info>
              {publicAddress(language) && <Info icon={MapPin} label={t.address}><span className="whitespace-pre-line">{publicAddress(language)}</span></Info>}
              {contactInfo.social.length > 0 && <Info icon={Share2} label={t.social}><div className="flex flex-wrap gap-3">{contactInfo.social.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{s.label}</a>)}</div></Info>}
              <Info icon={Clock} label={t.response}>{t.responseText}</Info>
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter language={language} />
    </div>
  );
};

const Info = ({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) => (
  <div className="flex gap-4 rounded-lg border bg-card p-5"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><div className="mt-1">{children}</div></div></div>
);

export default ContactPage;
