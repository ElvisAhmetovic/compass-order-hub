import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "@/components/public/PublicSiteChrome";
import { aboutPage } from "@/content/aboutPage";
import { usePublicLanguage } from "@/hooks/usePublicLanguage";
import heroImage from "@/assets/empria-about-team.jpg";

const AboutPage = () => {
  const { language, setLanguage } = usePublicLanguage();
  const copy = aboutPage.copy[language];
  const canonical = `https://empriatech.com${aboutPage.path}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: copy.metaTitle,
    url: canonical,
    description: copy.metaDescription,
    mainEntity: { "@id": "https://empriatech.com/#organization" },
  };

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
          <img src={heroImage} alt={copy.imageAlt} width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
          <div className="homepage-hero-overlay absolute inset-0" />
          <div className="relative mx-auto flex min-h-[calc(82svh-5rem)] max-w-7xl items-center px-5 py-20 lg:px-8">
            <div className="max-w-4xl">
              <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70"><span className="h-px w-10 bg-primary-foreground/50" />{copy.eyebrow}</p>
              <h1 className="font-heading text-5xl font-bold leading-[0.98] sm:text-6xl lg:text-7xl">{copy.title}<br /><span className="text-primary-foreground/65">{copy.accent}</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-primary-foreground/75">{copy.intro}</p>
              <Button size="lg" asChild className="mt-9 bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/kontakt">{copy.cta.primary}<ArrowRight /></Link></Button>
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.5fr] lg:gap-20">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.story.eyebrow}</p>
              <div>
                <h2 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.story.title}</h2>
                <div className="mt-8 max-w-3xl space-y-6">
                  {copy.story.paragraphs.map((text, index) => <p key={index} className="text-lg leading-8 text-muted-foreground">{text}</p>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/55 px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.values.eyebrow}</p>
            <h2 className="mt-5 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.values.title}</h2>
            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {copy.values.items.map((item) => (
                <article key={item.title} className="border-t-2 border-primary pt-6">
                  <h3 className="font-heading text-2xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary px-5 py-24 text-primary-foreground sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">{copy.team.eyebrow}</p>
            <h2 className="mt-5 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">{copy.team.title}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-primary-foreground/70">{copy.team.body}</p>
            <div className="mt-16 grid border-t border-primary-foreground/20 md:grid-cols-2 lg:grid-cols-4">
              {copy.team.roles.map((role) => (
                <article key={role.title} className="border-b border-primary-foreground/20 py-8 md:px-7 md:first:pl-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                  <h3 className="font-heading text-2xl font-bold">{role.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-primary-foreground/65">{role.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-10 text-sm text-primary-foreground/55">{copy.team.note}</p>
          </div>
        </section>

        <section className="px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-4xl font-bold leading-tight sm:text-6xl">{copy.cta.title}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.cta.body}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild><Link to="/kontakt">{copy.cta.primary}<ArrowRight /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/webdesign">{copy.cta.secondary}</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter language={language} />
    </div>
  );
};

export default AboutPage;
