export type HomepageLanguage = "de" | "en";

type HomepageCopy = {
  nav: { services: string; seo: string; process: string; login: string; register: string; menu: string };
  hero: { eyebrow: string; title: string; accent: string; body: string; primary: string; secondary: string; imageAlt: string; proof: string[] };
  intro: { eyebrow: string; title: string; body: string };
  web: { number: string; eyebrow: string; title: string; body: string; items: string[]; outcome: string };
  seo: { number: string; eyebrow: string; title: string; body: string; items: string[]; outcome: string };
  process: { eyebrow: string; title: string; steps: Array<{ number: string; title: string; body: string }> };
  results: { eyebrow: string; title: string; body: string; points: Array<{ title: string; body: string }> };
  cta: { eyebrow: string; title: string; body: string; primary: string; secondary: string };
  footer: { tagline: string; legal: string };
};

export const homepageCopy: Record<HomepageLanguage, HomepageCopy> = {
  de: {
    nav: { services: "Webdesign", seo: "Google SEO", process: "Prozess", login: "Anmelden", register: "Registrieren", menu: "Menü öffnen" },
    hero: {
      eyebrow: "Webdesign · Google SEO",
      title: "Digitale Präsenz, die",
      accent: "gefunden wird.",
      body: "Empria verbindet präzises Webdesign mit nachhaltiger Google-Optimierung – für Unternehmen, die digital professionell auftreten und organisch wachsen wollen.",
      primary: "Projekt starten",
      secondary: "Leistungen entdecken",
      imageAlt: "Moderner Arbeitsplatz mit Website und Analyse-Dashboard auf einem großen Bildschirm",
      proof: ["Strategisch geplant", "Responsiv umgesetzt", "Für Google optimiert"],
    },
    intro: {
      eyebrow: "Zwei Disziplinen. Ein klares Ziel.",
      title: "Websites müssen heute mehr können als nur gut aussehen.",
      body: "Sie müssen Vertrauen schaffen, Inhalte verständlich vermitteln und genau dann sichtbar sein, wenn potenzielle Kunden suchen. Deshalb denken wir Design und SEO von Anfang an zusammen.",
    },
    web: {
      number: "01",
      eyebrow: "Webdesign",
      title: "Ein digitaler Auftritt mit Substanz.",
      body: "Wir gestalten Websites, die Ihre Marke klar positionieren und Besucher ohne Umwege zum nächsten Schritt führen.",
      items: ["Individuelles UX- und UI-Design", "Optimiert für Mobilgeräte", "Klare Seiten- und Inhaltsstruktur", "Schnelle, saubere Umsetzung"],
      outcome: "Das Ergebnis: ein professioneller Auftritt, der glaubwürdig wirkt und sich einfach bedienen lässt.",
    },
    seo: {
      number: "02",
      eyebrow: "Google SEO",
      title: "Sichtbarkeit, die nachhaltig wächst.",
      body: "Wir schaffen die technische und inhaltliche Grundlage dafür, dass Google Ihre Website versteht – und die richtigen Menschen sie finden.",
      items: ["Fundierte Keyword- und Wettbewerbsanalyse", "Technische SEO-Grundlage", "Suchintention-orientierte Inhalte", "Nachvollziehbare Optimierung"],
      outcome: "Das Ergebnis: eine Website, die nicht nur existiert, sondern in relevanten Suchmomenten präsent ist.",
    },
    process: {
      eyebrow: "Unser Prozess",
      title: "Von der Idee zur sichtbaren digitalen Präsenz.",
      steps: [
        { number: "01", title: "Verstehen", body: "Wir klären Ziele, Zielgruppen, Markt und die Anforderungen an Ihren neuen Auftritt." },
        { number: "02", title: "Strukturieren", body: "Wir entwickeln Seitenarchitektur, Inhalte und eine klare Suchstrategie als gemeinsames Fundament." },
        { number: "03", title: "Gestalten", body: "Wir übersetzen Ihre Positionierung in ein präzises, eigenständiges und responsives Design." },
        { number: "04", title: "Optimieren", body: "Nach dem Start verbessern wir Sichtbarkeit und Wirkung auf Basis nachvollziehbarer Signale." },
      ],
    },
    results: {
      eyebrow: "Worauf es ankommt",
      title: "Eine Website als verlässlicher Teil Ihres Unternehmens.",
      body: "Keine kurzlebige Fassade, sondern ein digitales Fundament, das Ihre Kommunikation, Akquise und weitere Entwicklung unterstützt.",
      points: [
        { title: "Klar positioniert", body: "Besucher verstehen schnell, wer Sie sind und welchen konkreten Wert Sie bieten." },
        { title: "Konsequent auffindbar", body: "Struktur und Inhalte orientieren sich an echten Suchanfragen Ihrer Zielgruppe." },
        { title: "Bereit für Wachstum", body: "Ein belastbares System, das mit neuen Leistungen und Anforderungen erweitert werden kann." },
      ],
    },
    cta: {
      eyebrow: "Bereit für den nächsten Schritt?",
      title: "Machen wir Ihr Unternehmen digital sichtbar.",
      body: "Registrieren Sie sich bei Empria und starten Sie Ihr nächstes Webdesign- oder SEO-Projekt.",
      primary: "Jetzt registrieren",
      secondary: "Bereits Kunde? Anmelden",
    },
    footer: { tagline: "Webdesign und Google SEO mit klarer Strategie.", legal: "Alle Rechte vorbehalten." },
  },
  en: {
    nav: { services: "Web design", seo: "Google SEO", process: "Process", login: "Log in", register: "Register", menu: "Open menu" },
    hero: {
      eyebrow: "Web design · Google SEO",
      title: "A digital presence built",
      accent: "to be found.",
      body: "Empria combines precise web design with sustainable Google optimization for companies ready to present themselves professionally and grow organically.",
      primary: "Start a project",
      secondary: "Explore services",
      imageAlt: "Modern workspace with a website and analytics dashboard on a large screen",
      proof: ["Strategically planned", "Responsively built", "Optimized for Google"],
    },
    intro: {
      eyebrow: "Two disciplines. One clear goal.",
      title: "Today, websites need to do more than look good.",
      body: "They need to build trust, communicate clearly and appear exactly when potential customers are searching. That is why we unite design and SEO from the very beginning.",
    },
    web: {
      number: "01",
      eyebrow: "Web design",
      title: "A digital presence with substance.",
      body: "We create websites that position your brand clearly and guide visitors naturally toward the next step.",
      items: ["Bespoke UX and UI design", "Optimized for mobile devices", "Clear page and content structure", "Fast, precise implementation"],
      outcome: "The result: a professional presence that feels credible and effortless to use.",
    },
    seo: {
      number: "02",
      eyebrow: "Google SEO",
      title: "Visibility designed to grow.",
      body: "We create the technical and editorial foundation Google needs to understand your website – so the right people can find it.",
      items: ["In-depth keyword and competitor research", "Technical SEO foundation", "Search-intent-led content", "Transparent optimization"],
      outcome: "The result: a website that does not merely exist, but appears in the search moments that matter.",
    },
    process: {
      eyebrow: "Our process",
      title: "From first idea to a visible digital presence.",
      steps: [
        { number: "01", title: "Understand", body: "We define goals, audiences, market context and the requirements for your new presence." },
        { number: "02", title: "Structure", body: "We develop architecture, content and a focused search strategy as one shared foundation." },
        { number: "03", title: "Design", body: "We translate your positioning into a precise, distinctive and responsive visual system." },
        { number: "04", title: "Optimize", body: "After launch, we improve visibility and impact using clear, measurable signals." },
      ],
    },
    results: {
      eyebrow: "What matters",
      title: "A website that becomes a reliable part of your business.",
      body: "Not a short-lived façade, but a digital foundation supporting communication, acquisition and future development.",
      points: [
        { title: "Clearly positioned", body: "Visitors quickly understand who you are and the specific value you provide." },
        { title: "Consistently discoverable", body: "Structure and content align with the real searches your audience makes." },
        { title: "Ready to grow", body: "A robust system that can expand with new services and changing requirements." },
      ],
    },
    cta: {
      eyebrow: "Ready for the next step?",
      title: "Let’s make your business visible online.",
      body: "Register with Empria and start your next web design or Google SEO project.",
      primary: "Register now",
      secondary: "Already a client? Log in",
    },
    footer: { tagline: "Web design and Google SEO with a clear strategy.", legal: "All rights reserved." },
  },
};