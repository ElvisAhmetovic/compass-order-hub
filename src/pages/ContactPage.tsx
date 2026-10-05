import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { CheckCircle2, Clock, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PublicFooter, PublicHeader } from "@/components/public/PublicSiteChrome";
import { usePublicLanguage } from "@/hooks/usePublicLanguage";
import { supabase } from "@/integrations/supabase/client";
import { contactInfo, publicAddress } from "@/config/contactInfo";

const copy = {
  de: {
    title: "Kontakt — Empria Tech",
    description: "Kontaktieren Sie Empria Tech für Webdesign, Google SEO und Digital Marketing. Wir antworten in der Regel innerhalb eines Werktags.",
    eyebrow: "Kontakt", h1: "Lassen Sie uns über Ihr Projekt sprechen",
    intro: "Erzählen Sie uns kurz, worum es geht – neue Website, bessere Google-Sichtbarkeit oder mehr Anfragen über digitale Kanäle. Wir melden uns persönlich bei Ihnen.",
    name: "Name", email: "E-Mail", company: "Firma (optional)", service: "Gewünschte Leistung", message: "Ihre Nachricht",
    services: ["Webdesign", "Google SEO", "Digital Marketing", "Sonstiges"], choose: "Bitte wählen",
    send: "Anfrage senden", sending: "Wird gesendet …",
    success: "Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns in Kürze.",
    error: "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt per E-Mail.",
    errName: "Bitte geben Sie Ihren Namen ein.", errEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.", errMessage: "Bitte schreiben Sie mindestens 10 Zeichen.",
    privacy: "Ihre Angaben verwenden wir ausschließlich zur Bearbeitung Ihrer Anfrage.",
    direct: "Direkter Kontakt", address: "Adresse", phone: "Telefon", social: "Social Media", response: "Antwortzeit", responseText: "In der Regel innerhalb eines Werktags",
  },
  en: {
    title: "Contact — Empria Tech",
    description: "Contact Empria Tech for web design, Google SEO and digital marketing. We usually reply within one business day.",
    eyebrow: "Contact", h1: "Let's talk about your project",
    intro: "Tell us briefly what you need – a new website, better Google visibility or more leads from digital channels. We will get back to you personally.",
    name: "Name", email: "Email", company: "Company (optional)", service: "Service of interest", message: "Your message",
    services: ["Web design", "Google SEO", "Digital marketing", "Other"], choose: "Please choose",
    send: "Send inquiry", sending: "Sending …",
    success: "Thank you! We have received your inquiry and will be in touch shortly.",
    error: "Your inquiry could not be sent. Please try again or email us directly.",
    errName: "Please enter your name.", errEmail: "Please enter a valid email address.", errMessage: "Please write at least 10 characters.",
    privacy: "We use your details only to handle your inquiry.",
    direct: "Direct contact", address: "Address", phone: "Phone", social: "Social media", response: "Response time", responseText: "Usually within one business day",
  },
};

const ContactPage = () => {
  const { language, setLanguage } = usePublicLanguage();
  const t = copy[language];
  const [form, setForm] = useState({ name: "", email: "", company: "", service: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const schema = z.object({
    name: z.string().trim().min(1, t.errName).max(100),
    email: z.string().trim().email(t.errEmail).max(255),
    company: z.string().trim().max(150),
    service: z.string().max(60),
    message: z.string().trim().min(10, t.errMessage).max(3000),
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    if (form.website) { setStatus("sent"); return; }
    setStatus("sending");
    const { error } = await supabase.functions.invoke("send-contact-inquiry", { body: { ...result.data, language, website: "" } });
    if (error) { setStatus("error"); return; }
    setStatus("sent");
    setForm({ name: "", email: "", company: "", service: "", message: "", website: "" });
  };

  const field = "mt-2";
  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-destructive">{errors[k]}</p>;

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
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "ContactPage", name: t.title, url: "https://empriatech.com/kontakt", about: { "@type": "Organization", name: "Empria Tech", legalName: contactInfo.legalName, email: contactInfo.email, ...(contactInfo.phone && { telephone: contactInfo.phone }), ...(contactInfo.social.length && { sameAs: contactInfo.social.map((s) => s.url) }) } })}</script>
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
            <form onSubmit={submit} noValidate className="rounded-lg border bg-card p-6 shadow-sm sm:p-8">
              {status === "sent" ? (
                <div className="flex flex-col items-center py-12 text-center"><CheckCircle2 className="h-12 w-12 text-primary" /><p className="mt-4 max-w-md text-lg">{t.success}</p></div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><Label htmlFor="name">{t.name}</Label><Input id="name" className={field} value={form.name} onChange={update("name")} maxLength={100} autoComplete="name" />{err("name")}</div>
                  <div><Label htmlFor="email">{t.email}</Label><Input id="email" type="email" className={field} value={form.email} onChange={update("email")} maxLength={255} autoComplete="email" />{err("email")}</div>
                  <div><Label htmlFor="company">{t.company}</Label><Input id="company" className={field} value={form.company} onChange={update("company")} maxLength={150} autoComplete="organization" /></div>
                  <div><Label htmlFor="service">{t.service}</Label>
                    <select id="service" value={form.service} onChange={update("service")} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">{t.choose}</option>{t.services.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select></div>
                  <div className="sm:col-span-2"><Label htmlFor="message">{t.message}</Label><Textarea id="message" rows={6} className={field} value={form.message} onChange={update("message")} maxLength={3000} />{err("message")}</div>
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.website} onChange={update("website")} />
                  <div className="sm:col-span-2">
                    {status === "error" && <p className="mb-3 text-sm text-destructive">{t.error}</p>}
                    <Button type="submit" size="lg" disabled={status === "sending"}>{status === "sending" ? t.sending : t.send}</Button>
                    <p className="mt-3 text-xs text-muted-foreground">{t.privacy}</p>
                  </div>
                </div>
              )}
            </form>
            <aside className="space-y-6">
              <h2 className="font-heading text-2xl font-bold">{t.direct}</h2>
              <Info icon={Mail} label={t.email}><a className="hover:text-primary" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></Info>
              {contactInfo.phone && <Info icon={Phone} label={t.phone}><a className="hover:text-primary" href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}>{contactInfo.phone}</a></Info>}
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
