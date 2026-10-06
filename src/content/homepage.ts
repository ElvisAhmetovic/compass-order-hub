export type HomepageLanguage = "de" | "en";

export type ServiceSection = {
  eyebrow: string;
  title: string;
  body: string;
  imageAlt: string;
  items: Array<{ title: string; body: string }>;
  outcome: string;
};

type HomepageCopy = {
  nav: { services: string; expertise: string; process: string; faq: string; login: string; register: string; menu: string };
  hero: { eyebrow: string; title: string; accent: string; body: string; primary: string; secondary: string; imageAlt: string; proof: string[] };
  intro: { eyebrow: string; title: string; body: string };
  web: ServiceSection;
  seo: ServiceSection;
  marketing: ServiceSection;
  app: ServiceSection;
  webApp: {
    eyebrow: string;
    title: string;
    body: string;
    imageAlts: [string, string];
    items: Array<{ title: string; body: string }>;
    outcome: string;
    webLink: string;
    appLink: string;
  };
  synergy: { eyebrow: string; title: string; body: string; imageAlt: string; points: Array<{ title: string; body: string }> };
  expertise: { eyebrow: string; title: string; body: string; items: Array<{ title: string; body: string }> };
  process: { eyebrow: string; title: string; body: string; steps: Array<{ number: string; title: string; body: string }> };
  audience: { eyebrow: string; title: string; body: string; items: string[] };
  faq: { eyebrow: string; title: string; items: Array<{ question: string; answer: string }> };
  cta: { eyebrow: string; title: string; body: string; primary: string; secondary: string };
  footer: { tagline: string; legal: string };
};

export const homepageCopy: Record<HomepageLanguage, HomepageCopy> = {
  de: {
    nav: { services: "Leistungen", expertise: "Expertise", process: "Prozess", faq: "FAQ", login: "Anmelden", register: "Registrieren", menu: "Menü öffnen" },
    hero: {
      eyebrow: "Empria Tech · Webdesign · Google SEO · Digital Marketing",
      title: "Digitale Präsenz und Marketing",
      accent: "für nachhaltige Sichtbarkeit.",
      body: "Empria Tech verbindet professionelle Websites, fundierte Google-SEO-Strategien und koordiniertes Digital Marketing – klar gestaltet, technisch sauber und auf nachhaltiges Wachstum ausgerichtet.",
      primary: "Projekt starten",
      secondary: "Leistungen ansehen",
      imageAlt: "Moderner Arbeitsplatz mit Website und Analyse-Dashboard auf einem großen Bildschirm",
      proof: ["Individuell konzipiert", "Responsiv entwickelt", "Für Google optimiert"],
    },
    intro: {
      eyebrow: "Design trifft Sichtbarkeit",
      title: "Eine gute Website gewinnt Aufmerksamkeit. Eine starke Website gewinnt Kunden.",
      body: "Glaubwürdiges Design, verständliche Inhalte und eine technisch solide Grundlage gehören zusammen. Wir führen diese Disziplinen in einem fokussierten digitalen Auftritt zusammen, der Menschen überzeugt und von Suchmaschinen verstanden wird.",
    },
    web: {
      eyebrow: "01 · Webdesign",
      title: "Ein digitaler Auftritt, der Ihre Marke klar positioniert.",
      body: "Wir gestalten Websites rund um Ihre Ziele, Ihre Zielgruppe und den nächsten sinnvollen Schritt. Jede Seite erhält eine klare Aufgabe – vom ersten Eindruck bis zur Anfrage.",
      imageAlt: "Desktop- und mobile Ansicht einer professionell gestalteten Unternehmenswebsite",
      items: [
        { title: "Strategie & Struktur", body: "Seitenarchitektur und Nutzerführung auf Basis Ihrer Leistungen und Zielgruppen." },
        { title: "UX & UI Design", body: "Eigenständige Gestaltung mit verständlicher Hierarchie und konsistenter Markenwirkung." },
        { title: "Responsive Entwicklung", body: "Sorgfältige Umsetzung für Smartphone, Tablet und Desktop." },
        { title: "Performance-Basis", body: "Saubere, schlanke Seiten als Grundlage für schnelle Ladezeiten und gute Bedienbarkeit." },
      ],
      outcome: "Das Ergebnis ist keine austauschbare Vorlage, sondern eine Website, die professionell wirkt, Orientierung schafft und Ihr Unternehmen glaubwürdig präsentiert.",
    },
    seo: {
      eyebrow: "02 · Google SEO",
      title: "Organische Sichtbarkeit für die Suchanfragen, die wirklich zählen.",
      body: "Wir verbinden technische Qualität, relevante Inhalte und eine nachvollziehbare Suchstrategie. So entsteht eine Grundlage, auf der Ihre Präsenz bei Google langfristig wachsen kann.",
      imageAlt: "SEO-Arbeitsplatz mit Suchanalyse, Keyword-Daten und technischen Website-Auswertungen",
      items: [
        { title: "Keyword & Marktanalyse", body: "Relevante Themen, Suchintentionen und Wettbewerbsumfeld systematisch verstehen." },
        { title: "Technisches SEO", body: "Indexierbarkeit, Seitenstruktur, Metadaten und technische Signale sauber aufsetzen." },
        { title: "On-Page & Inhalte", body: "Seiten und Texte so strukturieren, dass Nutzer und Suchmaschinen den Wert erkennen." },
        { title: "Lokale Sichtbarkeit", body: "Standortbezogene Suchanfragen und lokale Relevanz gezielt berücksichtigen." },
      ],
      outcome: "Der Fokus liegt auf belastbarer, organischer Entwicklung – nicht auf kurzfristigen Versprechen oder unklaren Maßnahmen.",
    },
    marketing: {
      eyebrow: "03 · Digital Marketing",
      title: "Kampagnen und Inhalte mit klarer Richtung.",
      body: "Wir verbinden Kanäle, Botschaften, Inhalte und Zielseiten zu einer koordinierten digitalen Präsenz, die Ihre Marke konsistent vermittelt.",
      imageAlt: "Digital-Marketing-Arbeitsplatz mit Kampagnenplanung, Content-Kalender und Leistungsdaten",
      items: [
        { title: "Kanalstrategie", body: "Relevante Kanäle nach Zielgruppe, Aufgabe und Potenzial auswählen." },
        { title: "Kampagnenplanung", body: "Botschaft, Zeitplan, Formate und Zielseiten gemeinsam entwickeln." },
        { title: "Content & Social", body: "Nützliche Inhalte für eine konsistente und relevante Präsenz planen." },
        { title: "Analyse", body: "Ergebnisse auswerten und nächste Maßnahmen gezielt verbessern." },
      ],
      outcome: "Das Ergebnis: digitales Marketing als verständliches System statt unverbundener Einzelmaßnahmen.",
    },
    app: {
      eyebrow: "04 · App-Entwicklung",
      title: "Web- und Mobile-Apps, die Abläufe vereinfachen.",
      body: "Wir konzipieren und entwickeln individuelle Anwendungen – von Kundenportalen über interne Tools bis zu iOS- und Android-Apps – mit klarer Bedienung und solider Technik.",
      imageAlt: "Laptop mit Web-App-Dashboard und Smartphone mit mobiler App",
      items: [
        { title: "Web-Apps", body: "Browserbasierte Anwendungen für Kunden, Teams und Prozesse." },
        { title: "Mobile Apps", body: "Apps für iOS und Android mit durchdachter Nutzerführung." },
        { title: "Portale & Tools", body: "Kundenbereiche, Dashboards und interne Werkzeuge." },
        { title: "Schnittstellen", body: "Anbindung bestehender Systeme, Zahlungen und Daten." },
      ],
      outcome: "Das Ziel: Software, die echte Aufgaben löst und mit Ihrem Unternehmen wachsen kann.",
    },
    webApp: {
      eyebrow: "01 · Web & App Development Services",
      title: "Digitale Produkte, die professionell auftreten und zuverlässig arbeiten.",
      body: "Von der Unternehmenswebsite bis zur individuellen Anwendung entwickeln wir digitale Lösungen als zusammenhängendes System – klar gestaltet, responsiv umgesetzt und auf Ihre tatsächlichen Abläufe ausgerichtet.",
      imageAlts: [
        "Desktop- und mobile Ansicht einer professionell gestalteten Unternehmenswebsite",
        "Laptop mit Web-App-Dashboard und Smartphone mit mobiler App",
      ],
      items: [
        { title: "Unternehmenswebsites", body: "Individuelle Websites mit klarer Struktur, glaubwürdigem Design und verständlicher Nutzerführung." },
        { title: "Onlineshops & Landingpages", body: "Fokussierte digitale Verkaufsflächen, die Angebote übersichtlich präsentieren und Anfragen erleichtern." },
        { title: "Web-Anwendungen", body: "Browserbasierte Anwendungen für Kunden, Teams und wiederkehrende Geschäftsprozesse." },
        { title: "iOS- & Android-Apps", body: "Mobile Anwendungen mit durchdachten Abläufen und einer konsistenten Bedienung auf beiden Plattformen." },
        { title: "Kundenportale & interne Tools", body: "Geschützte Bereiche, Dashboards und Werkzeuge, die Informationen und Aufgaben an einem Ort bündeln." },
        { title: "Integrationen & individuelle Software", body: "Passende Verbindungen zu bestehenden Systemen, Zahlungen und Daten statt isolierter Einzellösungen." },
      ],
      outcome: "Das Ergebnis ist eine digitale Lösung, die zu Ihrem Unternehmen passt, konkrete Aufgaben löst und langfristig erweitert werden kann.",
      webLink: "Webdesign entdecken",
      appLink: "App-Entwicklung entdecken",
    },
    synergy: {
      eyebrow: "Ein gemeinsames Fundament",
      title: "Design und SEO wirken stärker, wenn sie gemeinsam geplant werden.",
      body: "Nachträgliche Optimierung kostet Zeit und führt oft zu Kompromissen. Empria Tech berücksichtigt Suchverhalten, Inhalte, Technik und Gestaltung bereits in der Konzeption.",
      imageAlt: "Strategietisch mit Website-Wireframes, Inhaltsstruktur und digitalem Prototyp",
      points: [
        { title: "Klare Informationsarchitektur", body: "Wichtige Themen erhalten den richtigen Platz und bleiben leicht erreichbar." },
        { title: "Inhalte mit Aufgabe", body: "Jeder Abschnitt beantwortet eine konkrete Frage und führt logisch weiter." },
        { title: "Technik ohne Umwege", body: "Performance, mobile Nutzung und Crawlbarkeit werden nicht erst am Ende geprüft." },
      ],
    },
    expertise: {
      eyebrow: "Was Sie erhalten",
      title: "Ein durchdachtes System statt einzelner Maßnahmen.",
      body: "Wir betrachten Ihre Website als zusammenhängendes digitales Werkzeug – von der Positionierung bis zur laufenden Auffindbarkeit.",
      items: [
        { title: "Positionierung", body: "Eine klare Botschaft, die Ihren Wert schnell verständlich macht." },
        { title: "Content-Struktur", body: "Relevante Seiten und Themen entlang echter Informationsbedürfnisse." },
        { title: "Designsystem", body: "Ein konsistenter visueller Rahmen, der professionell und erweiterbar bleibt." },
        { title: "Messbare Grundlage", body: "Eine technisch nachvollziehbare Basis für weitere Optimierung." },
      ],
    },
    process: {
      eyebrow: "Unser Prozess",
      title: "Strukturiert von der ersten Analyse bis zur Weiterentwicklung.",
      body: "Klare Phasen sorgen für nachvollziehbare Entscheidungen und ein Ergebnis, bei dem Inhalt, Gestaltung und Technik zusammenpassen.",
      steps: [
        { number: "01", title: "Verstehen", body: "Wir klären Ziele, Zielgruppen, Angebot, Wettbewerb und den aktuellen digitalen Ausgangspunkt." },
        { number: "02", title: "Strategie", body: "Wir entwickeln Seitenarchitektur, Suchthemen und inhaltliche Prioritäten als gemeinsames Fundament." },
        { number: "03", title: "Design & Umsetzung", body: "Wir gestalten und entwickeln einen responsiven Auftritt mit klarer Nutzerführung." },
        { number: "04", title: "Start & Optimierung", body: "Nach dem Start prüfen und verbessern wir Sichtbarkeit und Wirkung anhand nachvollziehbarer Signale." },
      ],
    },
    audience: {
      eyebrow: "Für wen wir arbeiten",
      title: "Für Unternehmen, die digital professioneller auftreten und besser gefunden werden möchten.",
      body: "Ob neuer Auftritt oder Weiterentwicklung: Entscheidend ist ein klares Ziel und der Anspruch, Design und Sichtbarkeit nicht getrennt zu betrachten.",
      items: ["Unternehmen mit veralteter oder unklarer Website", "Marken vor einem digitalen Neustart", "Dienstleister mit Wachstum über Google", "Teams, die Struktur in Inhalte und Angebote bringen möchten"],
    },
    faq: {
      eyebrow: "Häufige Fragen",
      title: "Was Sie vor einem Projekt wissen sollten.",
      items: [
        { question: "Bietet Empria Tech Webdesign und SEO auch einzeln an?", answer: "Ja. Beide Leistungen können gezielt eingesetzt werden. Besonders wirkungsvoll ist jedoch die gemeinsame Planung, weil Struktur, Inhalte, Technik und Gestaltung dann von Anfang an aufeinander abgestimmt sind." },
        { question: "Ist jede Website für Mobilgeräte optimiert?", answer: "Ja. Responsive Gestaltung und eine klare mobile Bedienung sind fester Bestandteil des Webdesign-Prozesses." },
        { question: "Kann SEO eine bestimmte Google-Position garantieren?", answer: "Nein. Seriöse Suchmaschinenoptimierung kann keine feste Position garantieren. Sie verbessert die technische und inhaltliche Grundlage, damit relevante Seiten langfristig bessere Chancen in der organischen Suche haben." },
        { question: "Können bestehende Websites optimiert werden?", answer: "Ja. Abhängig vom Ausgangspunkt kann eine bestehende Website strukturell, inhaltlich oder technisch weiterentwickelt werden. Der sinnvolle Umfang ergibt sich aus einer ersten Analyse." },
        { question: "Wie starte ich ein Projekt?", answer: "Registrieren Sie sich bei Empria Tech. Danach kann Ihr Vorhaben mit den wichtigsten Zielen und Anforderungen strukturiert aufgenommen werden." },
      ],
    },
    cta: {
      eyebrow: "Der nächste Schritt",
      title: "Machen wir Ihre digitale Präsenz klarer, stärker und sichtbarer.",
      body: "Registrieren Sie sich bei Empria Tech und starten Sie Ihr nächstes Webdesign- oder Google-SEO-Projekt.",
      primary: "Jetzt registrieren",
      secondary: "Bereits Kunde? Anmelden",
    },
    footer: { tagline: "Professionelles Webdesign und Google SEO mit klarer Strategie.", legal: "Alle Rechte vorbehalten." },
  },
  en: {
    nav: { services: "Services", expertise: "Expertise", process: "Process", faq: "FAQ", login: "Log in", register: "Register", menu: "Open menu" },
    hero: {
      eyebrow: "Empria Tech · Web design · Google SEO · Digital marketing",
      title: "Digital presence and marketing",
      accent: "for lasting visibility.",
      body: "Empria Tech connects professional websites, sound Google SEO strategies and coordinated digital marketing — clearly designed, technically solid and built for sustainable growth.",
      primary: "Start a project",
      secondary: "View services",
      imageAlt: "Modern workspace with a website and analytics dashboard on a large screen",
      proof: ["Individually planned", "Responsively developed", "Optimized for Google"],
    },
    intro: {
      eyebrow: "Design meets visibility",
      title: "A good website earns attention. A strong website earns customers.",
      body: "Credible design, clear content and a technically sound foundation belong together. We unite these disciplines in a focused digital presence that convinces people and makes sense to search engines.",
    },
    web: {
      eyebrow: "01 · Web design",
      title: "A digital presence that positions your brand clearly.",
      body: "We design websites around your goals, your audience and the next useful action. Every page has a clear purpose, from the first impression to the enquiry.",
      imageAlt: "Desktop and mobile views of a professionally designed business website",
      items: [
        { title: "Strategy & structure", body: "Site architecture and user journeys shaped around your services and audiences." },
        { title: "UX & UI design", body: "Distinctive design with clear hierarchy and a consistent brand experience." },
        { title: "Responsive development", body: "Careful implementation for mobile, tablet and desktop." },
        { title: "Performance foundation", body: "Clean, lean pages built for fast loading and effortless use." },
      ],
      outcome: "The result is not a generic template, but a credible website that creates clarity and represents your company professionally.",
    },
    seo: {
      eyebrow: "02 · Google SEO",
      title: "Organic visibility for the searches that genuinely matter.",
      body: "We connect technical quality, relevant content and a transparent search strategy, creating a foundation your visibility on Google can grow from over time.",
      imageAlt: "SEO workspace showing search analysis, keyword data and technical website reports",
      items: [
        { title: "Keyword & market research", body: "Understand relevant topics, search intent and the competitive landscape." },
        { title: "Technical SEO", body: "Set up indexability, structure, metadata and technical signals correctly." },
        { title: "On-page & content", body: "Structure pages and copy so people and search engines recognize their value." },
        { title: "Local visibility", body: "Account for location-based searches and local relevance." },
      ],
      outcome: "The focus is dependable organic progress, not short-term promises or opaque tactics.",
    },
    marketing: {
      eyebrow: "03 · Digital marketing",
      title: "Campaigns and content with clear direction.",
      body: "We connect channels, messaging, content and landing pages in a coordinated digital presence that communicates your brand consistently.",
      imageAlt: "Digital marketing workspace showing campaign planning, a content calendar and performance data",
      items: [
        { title: "Channel strategy", body: "Select relevant channels by audience, purpose and potential." },
        { title: "Campaign planning", body: "Develop messaging, timing, formats and landing pages together." },
        { title: "Content & social", body: "Plan useful content for a consistent and relevant presence." },
        { title: "Analysis", body: "Evaluate results and improve the next actions deliberately." },
      ],
      outcome: "The result: digital marketing as an understandable system rather than disconnected tactics.",
    },
    app: {
      eyebrow: "04 · App development",
      title: "Web and mobile apps that simplify how you work.",
      body: "We design and build custom applications — from customer portals and internal tools to iOS and Android apps — with clear usability and solid engineering.",
      imageAlt: "Laptop showing a web app dashboard and a smartphone showing a mobile app",
      items: [
        { title: "Web apps", body: "Browser-based applications for customers, teams and processes." },
        { title: "Mobile apps", body: "iOS and Android apps with thoughtful user journeys." },
        { title: "Portals & tools", body: "Customer areas, dashboards and internal tools." },
        { title: "Integrations", body: "Connecting existing systems, payments and data." },
      ],
      outcome: "The result: software that solves real tasks and grows with your business.",
    },
    webApp: {
      eyebrow: "01 · Web & App Development Services",
      title: "Digital products that look professional and work reliably.",
      body: "From corporate websites to custom applications, we develop digital solutions as connected systems — clearly designed, responsively built and aligned with the way your business actually works.",
      imageAlts: [
        "Desktop and mobile views of a professionally designed business website",
        "Laptop showing a web app dashboard and a smartphone showing a mobile app",
      ],
      items: [
        { title: "Corporate websites", body: "Custom websites with clear structure, credible design and straightforward user journeys." },
        { title: "E-commerce & landing pages", body: "Focused digital sales experiences that present offers clearly and make enquiries easier." },
        { title: "Web applications", body: "Browser-based applications for customers, teams and recurring business processes." },
        { title: "iOS & Android apps", body: "Mobile applications with thoughtful flows and consistent usability across both platforms." },
        { title: "Customer portals & internal tools", body: "Secure areas, dashboards and tools that bring information and tasks together in one place." },
        { title: "Integrations & custom software", body: "Purposeful connections to existing systems, payments and data instead of isolated solutions." },
      ],
      outcome: "The result is a digital solution that fits your business, solves practical tasks and can evolve over time.",
      webLink: "Explore web design",
      appLink: "Explore app development",
    },
    synergy: {
      eyebrow: "One shared foundation",
      title: "Design and SEO work harder when they are planned together.",
      body: "Retrofitting optimization costs time and often creates compromises. Empria Tech considers search behavior, content, technology and design during the initial planning.",
      imageAlt: "Strategy table with website wireframes, content architecture and a digital prototype",
      points: [
        { title: "Clear information architecture", body: "Important topics get the right place and remain easy to reach." },
        { title: "Purposeful content", body: "Every section answers a real question and leads naturally to the next step." },
        { title: "Technology without detours", body: "Performance, mobile use and crawlability are considered before launch." },
      ],
    },
    expertise: {
      eyebrow: "What you receive",
      title: "A considered system, not a collection of isolated tactics.",
      body: "We treat your website as one connected digital tool, from market positioning to ongoing discoverability.",
      items: [
        { title: "Positioning", body: "A clear message that communicates your value quickly." },
        { title: "Content structure", body: "Relevant pages and topics organized around genuine information needs." },
        { title: "Design system", body: "A consistent visual framework that remains professional and expandable." },
        { title: "Measurable foundation", body: "A technically transparent base for continued optimization." },
      ],
    },
    process: {
      eyebrow: "Our process",
      title: "Structured from initial analysis to continued improvement.",
      body: "Clear phases make decisions transparent and produce a result where content, design and technology reinforce one another.",
      steps: [
        { number: "01", title: "Understand", body: "We clarify goals, audiences, your offer, the market and your current digital position." },
        { number: "02", title: "Strategize", body: "We develop the site architecture, search themes and content priorities as one foundation." },
        { number: "03", title: "Design & build", body: "We design and develop a responsive presence with clear user journeys." },
        { number: "04", title: "Launch & improve", body: "After launch, we evaluate and improve visibility and impact using transparent signals." },
      ],
    },
    audience: {
      eyebrow: "Who we work with",
      title: "For companies ready to look more professional online and become easier to find.",
      body: "Whether you need a new presence or want to improve an existing one, what matters is a clear goal and the ambition to treat design and visibility as one challenge.",
      items: ["Companies with an outdated or unclear website", "Brands preparing for a digital relaunch", "Service businesses seeking growth through Google", "Teams ready to bring structure to content and offers"],
    },
    faq: {
      eyebrow: "Frequently asked questions",
      title: "What to know before starting a project.",
      items: [
        { question: "Does Empria Tech offer web design and SEO separately?", answer: "Yes. Each service can be used independently. Planning them together is particularly effective because structure, content, technology and design align from the beginning." },
        { question: "Is every website optimized for mobile devices?", answer: "Yes. Responsive design and clear mobile usability are standard parts of the web design process." },
        { question: "Can SEO guarantee a specific Google position?", answer: "No. Responsible search optimization cannot guarantee a fixed position. It improves the technical and editorial foundation so relevant pages have a stronger long-term opportunity in organic search." },
        { question: "Can you improve an existing website?", answer: "Yes. Depending on its current state, an existing website can be improved structurally, editorially or technically. An initial review determines the sensible scope." },
        { question: "How do I start a project?", answer: "Register with Empria Tech. From there, your goals and main requirements can be captured and organized clearly." },
      ],
    },
    cta: {
      eyebrow: "The next step",
      title: "Let’s make your digital presence clearer, stronger and more visible.",
      body: "Register with Empria Tech and start your next web design or Google SEO project.",
      primary: "Register now",
      secondary: "Already a client? Log in",
    },
    footer: { tagline: "Professional web design and Google SEO with a clear strategy.", legal: "All rights reserved." },
  },
};