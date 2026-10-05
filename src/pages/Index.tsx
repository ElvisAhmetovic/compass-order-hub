import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { homepageCopy, type HomepageLanguage, type ServiceSection } from "@/content/homepage";
import heroImage from "@/assets/empria-digital-studio.jpg";
import webImage from "@/assets/empria-webdesign-studio.jpg";
import seoImage from "@/assets/empria-seo-analysis.jpg";
import strategyImage from "@/assets/empria-strategy-process.jpg";
import { ArrowRight, Check, ChevronDown, Menu, Search, X } from "lucide-react";

const Index = () => {
  const { isLoading } = useAuth();
  const [language, setLanguage] = useState<HomepageLanguage>(() => window.localStorage.getItem("empria-home-language") === "en" ? "en" : "de");
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = homepageCopy[language];

  useEffect(() => {
    window.localStorage.setItem("empria-home-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (nextLanguage: HomepageLanguage) => {
    setLanguage(nextLanguage);
    setMenuOpen(false);
  };

  const navItems = [
    { href: "#services", label: copy.nav.services },
    { href: "#expertise", label: copy.nav.expertise },
    { href: "#process", label: copy.nav.process },
    { href: "#faq", label: copy.nav.faq },
  ];

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-primary"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" aria-label="Loading" /></div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-primary-foreground/10 bg-primary/95 text-primary-foreground backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="group flex items-center gap-3" aria-label="Empria Tech home">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/25 bg-primary-foreground/10 transition-colors group-hover:bg-primary-foreground/15"><Search className="h-5 w-5" /></span>
            <span className="font-heading text-xl font-bold tracking-normal">EMPRIA TECH<span className="text-primary-foreground/55">.</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Main navigation">
            {navItems.map((item) => <a key={item.href} href={item.href} className="text-primary-foreground/75 transition-colors hover:text-primary-foreground">{item.label}</a>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitch language={language} onChange={changeLanguage} />
            <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/login">{copy.nav.login}</Link></Button>
            <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/register">{copy.nav.register}</Link></Button>
          </div>
          <Button type="button" variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={copy.nav.menu} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</Button>
        </div>
        {menuOpen && (
          <div className="border-t border-primary-foreground/10 bg-primary px-5 py-5 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="border-b border-primary-foreground/10 py-3 text-primary-foreground/80">{item.label}</a>)}
              <div className="mt-4"><LanguageSwitch language={language} onChange={changeLanguage} /></div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" asChild className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/login">{copy.nav.login}</Link></Button>
                <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/register">{copy.nav.register}</Link></Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative min-h-[92svh] overflow-hidden bg-primary pt-20 text-primary-foreground">
          <img src={heroImage} alt={copy.hero.imageAlt} width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="homepage-hero-overlay absolute inset-0" />
          <div className="relative mx-auto flex min-h-[calc(92svh-5rem)] max-w-7xl items-center px-5 py-16 lg:px-8">
            <div className="max-w-4xl animate-slide-in">
              <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70"><span className="h-px w-10 bg-primary-foreground/50" />{copy.hero.eyebrow}</p>
              <h1 className="font-heading text-5xl font-bold leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">{copy.hero.title}<br /><span className="text-primary-foreground/65">{copy.hero.accent}</span></h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-primary-foreground/75 sm:text-lg sm:leading-8">{copy.hero.body}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/register">{copy.hero.primary}<ArrowRight /></Link></Button>
                <Button size="lg" variant="outline" asChild className="border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><a href="#services">{copy.hero.secondary}</a></Button>
              </div>
              <div className="mt-12 flex flex-col gap-3 border-t border-primary-foreground/20 pt-6 text-xs font-medium text-primary-foreground/65 sm:flex-row sm:gap-8">
                {copy.hero.proof.map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4" />{item}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_2fr]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.intro.eyebrow}</p>
            <div><h2 className="max-w-4xl font-heading text-4xl font-bold leading-tight tracking-normal sm:text-5xl">{copy.intro.title}</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground">{copy.intro.body}</p></div>
          </div>
        </section>

        <div id="services" className="scroll-mt-20">
          <ServiceBlock section={copy.web} image={webImage} imageFirst />
          <ServiceBlock section={copy.seo} image={seoImage} />
        </div>

        <section className="border-y border-border bg-secondary/55 px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="overflow-hidden rounded-md"><img src={strategyImage} alt={copy.synergy.imageAlt} loading="lazy" width={1600} height={912} className="aspect-[16/10] h-full w-full object-cover" /></div>
            <div>
              <SectionHeading eyebrow={copy.synergy.eyebrow} title={copy.synergy.title} body={copy.synergy.body} />
              <div className="mt-9 space-y-6">{copy.synergy.points.map((point, index) => <article key={point.title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-border pt-5"><span className="text-xs font-bold text-primary">0{index + 1}</span><div><h3 className="font-heading text-xl font-bold">{point.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{point.body}</p></div></article>)}</div>
            </div>
          </div>
        </section>

        <section id="expertise" className="scroll-mt-20 bg-background px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-20"><SectionHeading eyebrow={copy.expertise.eyebrow} title={copy.expertise.title} /><p className="self-end text-lg leading-8 text-muted-foreground">{copy.expertise.body}</p></div>
            <div className="mt-16 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-4">{copy.expertise.items.map((item, index) => <article key={item.title} className="bg-card p-8"><span className="text-xs font-bold text-primary">0{index + 1}</span><h3 className="mt-9 font-heading text-xl font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p></article>)}</div>
          </div>
        </section>

        <section id="process" className="scroll-mt-20 bg-primary px-5 py-24 text-primary-foreground sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">{copy.process.eyebrow}</p>
            <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-20"><h2 className="font-heading text-4xl font-bold leading-tight tracking-normal sm:text-5xl">{copy.process.title}</h2><p className="self-end text-base leading-7 text-primary-foreground/65">{copy.process.body}</p></div>
            <div className="mt-16 grid border-t border-primary-foreground/20 md:grid-cols-2 lg:grid-cols-4">{copy.process.steps.map((step) => <article key={step.number} className="border-b border-primary-foreground/20 py-8 md:px-7 md:first:pl-0 lg:border-b-0 lg:border-r lg:last:border-r-0"><span className="text-sm font-semibold text-primary-foreground/45">{step.number}</span><h3 className="mt-12 font-heading text-2xl font-bold">{step.title}</h3><p className="mt-4 text-sm leading-6 text-primary-foreground/65">{step.body}</p></article>)}</div>
          </div>
        </section>

        <section className="bg-background px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <SectionHeading eyebrow={copy.audience.eyebrow} title={copy.audience.title} body={copy.audience.body} />
            <ul className="self-center border-t border-border">{copy.audience.items.map((item) => <li key={item} className="flex items-center gap-4 border-b border-border py-5 font-heading text-lg font-semibold"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><Check className="h-4 w-4" /></span>{item}</li>)}</ul>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-border bg-secondary/55 px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <SectionHeading eyebrow={copy.faq.eyebrow} title={copy.faq.title} />
            <div className="border-t border-border">{copy.faq.items.map((item) => <details key={item.question} className="group border-b border-border"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-heading text-lg font-bold"><span>{item.question}</span><ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" /></summary><p className="max-w-2xl pb-6 text-sm leading-7 text-muted-foreground">{item.answer}</p></details>)}</div>
          </div>
        </section>

        <section className="bg-background px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.cta.eyebrow}</p>
            <h2 className="mt-5 font-heading text-4xl font-bold leading-tight tracking-normal sm:text-6xl">{copy.cta.title}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.cta.body}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" asChild><Link to="/register">{copy.cta.primary}<ArrowRight /></Link></Button><Button size="lg" variant="outline" asChild><Link to="/login">{copy.cta.secondary}</Link></Button></div>
          </div>
        </section>
      </main>

      <footer className="bg-primary px-5 py-10 text-primary-foreground lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 border-b border-primary-foreground/15 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-heading text-xl font-bold">EMPRIA TECH.</p><p className="mt-2 text-sm text-primary-foreground/55">{copy.footer.tagline}</p></div>
          <div className="flex gap-5 text-sm"><Link to="/login" className="text-primary-foreground/70 hover:text-primary-foreground">{copy.nav.login}</Link><Link to="/register" className="text-primary-foreground/70 hover:text-primary-foreground">{copy.nav.register}</Link></div>
        </div>
        <div className="mx-auto flex max-w-7xl justify-between gap-4 pt-7 text-xs text-primary-foreground/45"><span>© {new Date().getFullYear()} Empria Tech</span><span>{copy.footer.legal}</span></div>
      </footer>
    </div>
  );
};

const LanguageSwitch = ({ language, onChange }: { language: HomepageLanguage; onChange: (language: HomepageLanguage) => void }) => (
  <div className="flex w-fit items-center rounded-md border border-primary-foreground/20 p-1" aria-label="Language">
    {(["de", "en"] as const).map((code) => <Button key={code} type="button" size="sm" variant="ghost" onClick={() => onChange(code)} className={language === code ? "h-7 bg-primary-foreground text-primary hover:bg-primary-foreground/90" : "h-7 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"} aria-pressed={language === code}>{code.toUpperCase()}</Button>)}
  </div>
);

const SectionHeading = ({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) => <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p><h2 className="mt-5 font-heading text-4xl font-bold leading-tight tracking-normal sm:text-5xl">{title}</h2>{body && <p className="mt-6 text-base leading-7 text-muted-foreground">{body}</p>}</div>;

const ServiceBlock = ({ section, image, imageFirst = false }: { section: ServiceSection; image: string; imageFirst?: boolean }) => (
  <section className={imageFirst ? "border-y border-border bg-secondary/55 px-5 py-24 sm:py-32 lg:px-8" : "bg-background px-5 py-24 sm:py-32 lg:px-8"}>
    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div className={imageFirst ? "overflow-hidden rounded-md" : "order-first overflow-hidden rounded-md lg:order-last"}><img src={image} alt={section.imageAlt} loading="lazy" width={1408} height={992} className="aspect-[7/5] h-full w-full object-cover" /></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{section.eyebrow}</p><h2 className="mt-5 font-heading text-4xl font-bold leading-tight tracking-normal sm:text-5xl">{section.title}</h2><p className="mt-6 text-base leading-7 text-muted-foreground">{section.body}</p><div className="mt-8 grid gap-5 sm:grid-cols-2">{section.items.map((item) => <article key={item.title} className="border-t border-border pt-4"><h3 className="flex items-center gap-2 font-heading text-base font-bold"><Check className="h-4 w-4 shrink-0 text-primary" />{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></article>)}</div><p className="mt-8 border-l-2 border-primary pl-5 text-sm font-medium leading-6">{section.outcome}</p></div>
    </div>
  </section>
);

export default Index;