import { Helmet } from "react-helmet-async";
import { PublicFooter, PublicHeader } from "@/components/public/PublicSiteChrome";
import { legalPages, type LegalKey } from "@/content/legalPages";
import { usePublicLanguage } from "@/hooks/usePublicLanguage";

const LegalPage = ({ pageKey }: { pageKey: LegalKey }) => {
  const { language, setLanguage } = usePublicLanguage();
  const page = legalPages[pageKey];
  const copy = page.copy[language];
  const canonical = `https://empriatech.com${page.path}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <html lang={language} />
        <title>{copy.metaTitle}</title>
        <meta name="description" content={copy.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={copy.metaTitle} />
        <meta property="og:description" content={copy.metaDescription} />
        <meta property="og:url" content={canonical} />
      </Helmet>
      <PublicHeader language={language} onLanguageChange={setLanguage} />
      <main className="px-5 pb-24 pt-36 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">{copy.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{copy.updated}</p>
          <div className="mt-12 space-y-10">
            {copy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-heading text-xl font-bold">{section.heading}</h2>
                {section.paragraphs.map((text, i) => <p key={i} className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">{text}</p>)}
              </section>
            ))}
          </div>
        </article>
      </main>
      <PublicFooter language={language} />
    </div>
  );
};

export default LegalPage;
