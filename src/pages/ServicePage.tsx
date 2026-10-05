import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "@/components/public/PublicSiteChrome";
import { serviceNames, servicePages, type ServiceKey } from "@/content/servicePages";
import { usePublicLanguage } from "@/hooks/usePublicLanguage";

const ServicePage = ({ serviceKey }: { serviceKey: ServiceKey }) => {
  const { language, setLanguage } = usePublicLanguage();
  const service = servicePages[serviceKey];
  const copy = service.copy[language];
  const canonical = `https://empriatech.com${service.path}`;
  const schema = { "@context": "https://schema.org", "@type": "Service", name: serviceNames[serviceKey][language], serviceType: serviceNames[serviceKey][language], url: canonical, description: copy.metaDescription, provider: { "@type": "Organization", "@id": "https://empriatech.com/#organization", name: "Empria Tech", url: "https://empriatech.com/" } };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Helmet>
        <html lang={language} />
        <title>{copy.metaTitle}</title>
        <meta name="description" content={copy.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={copy.metaTitle} />
        <meta property="og:description" content={copy.metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={copy.metaTitle} />
        <meta name="twitter:description" content={copy.metaDescription} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <PublicHeader language={language} onLanguageChange={setLanguage} />
      <main>
        <section className="relative min-h-[82svh] overflow-hidden bg-primary pt-20 text-primary-foreground">
          <img src={service.image} alt={copy.imageAlt} width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
          <div className="homepage-hero-overlay absolute inset-0" />
          <div className="relative mx-auto flex min-h-[calc(82svh-5rem)] max-w-7xl items-center px-5 py-20 lg:px-8"><div className="max-w-4xl"><p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70"><span className="h-px w-10 bg-primary-foreground/50" />{copy.eyebrow}</p><h1 className="font-heading text-5xl font-bold leading-[0.98] sm:text-6xl lg:text-7xl">{copy.title}<br /><span className="text-primary-foreground/65">{copy.accent}</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-primary-foreground/75">{copy.intro}</p><Button size="lg" asChild className="mt-9 bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/register">{copy.primary}<ArrowRight /></Link></Button></div></div>
        </section>

        <section className="px-5 py-24 sm:py-32 lg:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.5fr] lg:gap-20"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.overviewEyebrow}</p><div><h2 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.overviewTitle}</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{copy.overviewBody}</p></div></div><div className="mt-16 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-3">{copy.capabilities.map((item, index) => <article key={item.title} className="bg-card p-8"><span className="text-xs font-bold text-primary">0{index + 1}</span><h3 className="mt-8 font-heading text-xl font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p></article>)}</div></div></section>

        <section className="border-y border-border bg-secondary/55 px-5 py-24 sm:py-32 lg:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.deliverablesEyebrow}</p><h2 className="mt-5 font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.deliverablesTitle}</h2></div><ul className="border-t border-border">{copy.deliverables.map((item) => <li key={item} className="flex items-center gap-4 border-b border-border py-5 font-medium"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><Check className="h-4 w-4" /></span>{item}</li>)}</ul></div></section>

        <section className="bg-primary px-5 py-24 text-primary-foreground sm:py-32 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">{copy.processEyebrow}</p><h2 className="mt-5 max-w-4xl font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.processTitle}</h2><div className="mt-16 grid border-t border-primary-foreground/20 md:grid-cols-2 lg:grid-cols-4">{copy.process.map((step) => <article key={step.number} className="border-b border-primary-foreground/20 py-8 md:px-7 md:first:pl-0 lg:border-b-0 lg:border-r lg:last:border-r-0"><span className="text-sm font-semibold text-primary-foreground/45">{step.number}</span><h3 className="mt-12 font-heading text-2xl font-bold">{step.title}</h3><p className="mt-4 text-sm leading-6 text-primary-foreground/65">{step.body}</p></article>)}</div></div></section>

        <section className="px-5 py-24 sm:py-32 lg:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-2 lg:gap-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.outcomesEyebrow}</p><h2 className="mt-5 font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.outcomesTitle}</h2></div><p className="self-end text-lg leading-8 text-muted-foreground">{copy.outcomesBody}</p></div><div className="mt-14 grid gap-8 md:grid-cols-3">{copy.outcomes.map((item) => <article key={item.title} className="border-t-2 border-primary pt-6"><h3 className="font-heading text-2xl font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p></article>)}</div></div></section>

        <section className="border-y border-border bg-secondary/55 px-5 py-24 sm:py-32 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.relatedEyebrow}</p><h2 className="mt-5 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.relatedTitle}</h2><div className="mt-12 grid gap-5 md:grid-cols-2">{service.related.map((key) => { const related = servicePages[key]; const relatedCopy = related.copy[language]; return <Link key={key} to={related.path} className="group border border-border bg-card p-8 transition-colors hover:border-primary"><span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Empria Tech</span><h3 className="mt-5 font-heading text-3xl font-bold">{serviceNames[key][language]}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{relatedCopy.intro}</p><span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary">{language === "de" ? "Leistung ansehen" : "View service"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>; })}</div></div></section>

        <section className="px-5 py-24 sm:py-32 lg:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.faqEyebrow}</p><h2 className="mt-5 font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.faqTitle}</h2></div><div className="border-t border-border">{copy.faqs.map((item) => <details key={item.question} className="group border-b border-border"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-heading text-lg font-bold"><span>{item.question}</span><ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" /></summary><p className="max-w-2xl pb-6 text-sm leading-7 text-muted-foreground">{item.answer}</p></details>)}</div></div></section>

        <section className="border-t border-border bg-secondary/55 px-5 py-24 sm:py-32 lg:px-8"><div className="mx-auto max-w-4xl text-center"><h2 className="font-heading text-4xl font-bold leading-tight sm:text-6xl">{copy.ctaTitle}</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.ctaBody}</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" asChild><Link to="/register">{copy.ctaPrimary}<ArrowRight /></Link></Button><Button size="lg" variant="outline" asChild><Link to="/login">{copy.ctaSecondary}</Link></Button></div></div></section>
      </main>
      <PublicFooter language={language} />
    </div>
  );
};

export default ServicePage;