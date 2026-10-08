import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { createContactFormSchema } from "@/components/public/contactFormSchema";
import type { HomepageLanguage } from "@/content/homepage";

const copy = {
  de: {
    name: "Name", email: "E-Mail", company: "Firma (optional)", service: "Gewünschte Leistung", message: "Ihre Nachricht",
    services: ["Webdesign", "App-Entwicklung", "Google SEO", "Digital Marketing", "Sonstiges"], choose: "Bitte wählen",
    send: "Anfrage senden", sending: "Wird gesendet …",
    success: "Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns in Kürze.",
    error: "Die Anfrage konnte nicht gesendet werden. Ihre Eingaben bleiben erhalten, damit Sie es erneut versuchen können.",
    errName: "Bitte geben Sie Ihren Namen ein.", errEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.", errMessage: "Bitte schreiben Sie mindestens 10 Zeichen.",
    privacy: "Ihre Angaben verwenden wir ausschließlich zur Bearbeitung Ihrer Anfrage.",
    consent: <>Mit dem Absenden werden Ihre Angaben zur Bearbeitung Ihrer Anfrage verwendet. Mehr in der <Link to="/datenschutz" className="underline hover:text-primary">Datenschutzerklärung</Link>.</>,
  },
  en: {
    name: "Name", email: "Email", company: "Company (optional)", service: "Service of interest", message: "Your message",
    services: ["Web design", "App development", "Google SEO", "Digital marketing", "Other"], choose: "Please choose",
    send: "Send inquiry", sending: "Sending …",
    success: "Thank you! We have received your inquiry and will be in touch shortly.",
    error: "Your inquiry could not be sent. Your details are still here so you can try again.",
    errName: "Please enter your name.", errEmail: "Please enter a valid email address.", errMessage: "Please write at least 10 characters.",
    privacy: "We use your details only to handle your inquiry.",
    consent: <>By submitting, your details are used to handle your enquiry. See our <Link to="/datenschutz" className="underline hover:text-primary">privacy policy</Link>.</>,
  },
};

type PublicContactFormProps = {
  language: HomepageLanguage;
  className?: string;
};

export const PublicContactForm = ({ language, className = "" }: PublicContactFormProps) => {
  const t = copy[language];
  const [form, setForm] = useState({ name: "", email: "", company: "", service: "", message: "" });
  const [botField, setBotField] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const schema = createContactFormSchema({ name: t.errName, email: t.errEmail, message: t.errMessage });

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: "" }));
    if (status === "error") setStatus("idle");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }

    setErrors({});
    if (botField) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-inquiry", {
        body: { ...result.data, language, website: "" },
      });
      if (error || data?.ok !== true) {
        setStatus("error");
        return;
      }
      setStatus("sent");
      setForm({ name: "", email: "", company: "", service: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const errorMessage = (key: string) => errors[key] && <p id={`${key}-error`} className="mt-1 text-sm text-destructive">{errors[key]}</p>;

  return (
    <form onSubmit={submit} noValidate className={className}>
      {status === "sent" ? (
        <div className="flex min-h-80 flex-col items-center justify-center py-12 text-center" role="status">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <p className="mt-4 max-w-md text-lg">{t.success}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="contact-name">{t.name}</Label><Input id="contact-name" className="mt-2" value={form.name} onChange={update("name")} maxLength={100} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />{errorMessage("name")}</div>
          <div><Label htmlFor="contact-email">{t.email}</Label><Input id="contact-email" type="email" className="mt-2" value={form.email} onChange={update("email")} maxLength={255} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />{errorMessage("email")}</div>
          <div><Label htmlFor="contact-company">{t.company}</Label><Input id="contact-company" className="mt-2" value={form.company} onChange={update("company")} maxLength={150} autoComplete="organization" /></div>
          <div><Label htmlFor="contact-service">{t.service}</Label><select id="contact-service" value={form.service} onChange={update("service")} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">{t.choose}</option>{t.services.map((service) => <option key={service} value={service}>{service}</option>)}</select></div>
          <div className="sm:col-span-2"><Label htmlFor="contact-message">{t.message}</Label><Textarea id="contact-message" rows={6} className="mt-2" value={form.message} onChange={update("message")} maxLength={3000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} />{errorMessage("message")}</div>
          <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><Label htmlFor="contact-fax">Fax</Label><Input id="contact-fax" name="fax_number" value={botField} onChange={(event) => setBotField(event.target.value)} tabIndex={-1} autoComplete="off" /></div>
          <p className="text-xs text-muted-foreground sm:col-span-2">{t.consent}</p>
          <div className="sm:col-span-2">
            {status === "error" && <p className="mb-3 text-sm text-destructive" role="alert">{t.error}</p>}
            <Button type="submit" size="lg" disabled={status === "sending"}>{status === "sending" ? t.sending : t.send}</Button>
            <p className="mt-3 text-xs text-muted-foreground">{t.privacy}</p>
          </div>
        </div>
      )}
    </form>
  );
};