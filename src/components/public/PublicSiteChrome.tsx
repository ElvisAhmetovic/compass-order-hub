import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HomepageLanguage } from "@/content/homepage";
import { contactInfo, publicAddress } from "@/config/contactInfo";
import symbolAsset from "@/assets/media-marketing-symbol.png.asset.json";
import textLogoAsset from "@/assets/media-marketing-logo-text.png.asset.json";

const labels = {
  de: { web: "Webdesign", seo: "Google SEO", marketing: "Digital Marketing", app: "App-Entwicklung", contact: "Kontakt", about: "Über uns", login: "Anmelden", register: "Registrieren", menu: "Menü öffnen", tagline: "Webdesign, Google SEO, Digital Marketing und App-Entwicklung mit klarer Strategie.", operator: "Empria Tech wird von MEDIA MARKETING LTD betrieben, Unternehmensnummer 17507679.", legal: "Alle Rechte vorbehalten.", imprint: "Impressum", privacy: "Datenschutz", terms: "Geschäftsbedingungen" },
  en: { web: "Web design", seo: "Google SEO", marketing: "Digital marketing", app: "App development", contact: "Contact", about: "About us", login: "Log in", register: "Register", menu: "Open menu", tagline: "Web design, Google SEO, digital marketing and app development with a clear strategy.", operator: "Empria Tech is operated by MEDIA MARKETING LTD, company number 17507679.", legal: "All rights reserved.", imprint: "Legal notice", privacy: "Privacy policy", terms: "Terms" },
};

const serviceLinks = [
  { to: "/webdesign", key: "web" as const },
  { to: "/google-seo", key: "seo" as const },
  { to: "/digital-marketing", key: "marketing" as const },
  { to: "/app-entwicklung", key: "app" as const },
  { to: "/kontakt", key: "contact" as const },
];

export const PublicLanguageSwitch = ({ language, onChange }: { language: HomepageLanguage; onChange: (language: HomepageLanguage) => void }) => (
  <div className="flex w-fit items-center rounded-md border border-primary-foreground/20 p-1" aria-label="Language">
    {(["de", "en"] as const).map((code) => (
      <Button key={code} type="button" size="sm" variant="ghost" onClick={() => onChange(code)} className={language === code ? "h-7 bg-primary-foreground text-primary hover:bg-primary-foreground/90" : "h-7 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"} aria-pressed={language === code}>{code.toUpperCase()}</Button>
    ))}
  </div>
);

export const PublicHeader = ({ language, onLanguageChange }: { language: HomepageLanguage; onLanguageChange: (language: HomepageLanguage) => void }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = labels[language];
  const changeLanguage = (nextLanguage: HomepageLanguage) => { onLanguageChange(nextLanguage); setMenuOpen(false); };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-primary-foreground/10 bg-primary/95 text-primary-foreground backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex h-14 w-16 items-center justify-center rounded-lg bg-background p-1.5 transition-opacity hover:opacity-80" aria-label="Empria Tech home"><img src={symbolAsset.url} alt="Media Marketing LTD" className="h-full w-full object-contain" /></Link>
        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Main navigation">{serviceLinks.map((item) => <Link key={item.to} to={item.to} className="text-primary-foreground/75 transition-colors hover:text-primary-foreground">{copy[item.key]}</Link>)}</nav>
        <div className="hidden items-center gap-3 lg:flex"><PublicLanguageSwitch language={language} onChange={changeLanguage} /><Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/login">{copy.login}</Link></Button><Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/register">{copy.register}</Link></Button></div>
        <Button type="button" variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={copy.menu} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</Button>
      </div>
      {menuOpen && <div className="border-t border-primary-foreground/10 bg-primary px-5 py-5 lg:hidden"><nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">{serviceLinks.map((item) => <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="border-b border-primary-foreground/10 py-3 text-primary-foreground/80">{copy[item.key]}</Link>)}<div className="mt-4"><PublicLanguageSwitch language={language} onChange={changeLanguage} /></div><div className="mt-4 grid grid-cols-2 gap-3"><Button variant="outline" asChild className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/login">{copy.login}</Link></Button><Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Link to="/register">{copy.register}</Link></Button></div></nav></div>}
    </header>
  );
};

export const PublicFooter = ({ language }: { language: HomepageLanguage }) => {
  const copy = labels[language];
  const legal = [
    contactInfo.legalName,
    `${language === "de" ? "Unternehmensnummer" : "Company number"}: ${contactInfo.companyNumber}`,
    publicAddress(language),
    `${language === "de" ? "Büroadresse" : "Office address"}: ${contactInfo.officeAddress[language]}`,
    contactInfo.phone && <a key="phone" href={`tel:${contactInfo.phone.replace(/\s/g, "")}`} className="whitespace-nowrap hover:text-primary-foreground">{contactInfo.phone}</a>,
    <a key="email" href={`mailto:${contactInfo.email}`} className="whitespace-nowrap hover:text-primary-foreground">{contactInfo.email}</a>,
  ].filter(Boolean);
  return <footer className="bg-primary px-5 py-10 text-primary-foreground lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 border-b border-primary-foreground/15 pb-8 md:grid-cols-[1fr_auto_auto]"><div><Link to="/" className="flex w-56 items-center justify-center rounded-xl bg-background p-3 transition-opacity hover:opacity-80 sm:w-64" aria-label="Empria Tech home"><img src={textLogoAsset.url} alt="Media Marketing LTD" className="h-auto w-full object-contain" /></Link><p className="mt-4 max-w-sm text-sm text-primary-foreground/55">{copy.tagline}</p><p className="mt-3 max-w-md text-xs leading-5 text-primary-foreground/45">{copy.operator}</p></div><nav className="grid gap-3 text-sm" aria-label="Services">{serviceLinks.map((item) => <Link key={item.to} to={item.to} className="text-primary-foreground/70 hover:text-primary-foreground">{copy[item.key]}</Link>)}<Link to="/ueber-uns" className="text-primary-foreground/70 hover:text-primary-foreground">{copy.about}</Link></nav><div className="flex items-start gap-5 text-sm"><Link to="/login" className="text-primary-foreground/70 hover:text-primary-foreground">{copy.login}</Link><Link to="/register" className="text-primary-foreground/70 hover:text-primary-foreground">{copy.register}</Link></div></div><div className="mx-auto flex max-w-7xl flex-col gap-4 pt-7 text-xs text-primary-foreground/45 sm:flex-row sm:items-start sm:justify-between sm:gap-8"><p className="max-w-2xl leading-6">{legal.map((line, index) => <span key={index} className="after:mx-2 after:text-primary-foreground/30 after:content-['·'] last:after:hidden">{line}</span>)}</p><div className="flex shrink-0 flex-col gap-2 sm:items-end"><div className="flex flex-wrap gap-4"><Link to="/impressum" className="hover:text-primary-foreground">{copy.imprint}</Link><Link to="/datenschutz" className="hover:text-primary-foreground">{copy.privacy}</Link><Link to="/terms" className="hover:text-primary-foreground">{copy.terms}</Link></div><span className="sm:text-right">© {new Date().getFullYear()} Empria Tech · {copy.legal}</span></div></div></footer>;
};