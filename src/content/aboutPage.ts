import type { HomepageLanguage } from "@/content/homepage";

type AboutCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  imageAlt: string;
  story: { eyebrow: string; title: string; paragraphs: string[] };
  values: { eyebrow: string; title: string; items: Array<{ title: string; body: string }> };
  team: { eyebrow: string; title: string; body: string; roles: Array<{ title: string; body: string }>; note: string };
  cta: { title: string; body: string; primary: string; secondary: string };
};

export const aboutPage = {
  path: "/ueber-uns",
  copy: {
    de: {
      metaTitle: "Über uns — Empria Tech",
      metaDescription: "Empria Tech von MEDIA MARKETING LTD: Webdesign, Google SEO, Digital Marketing und App-Entwicklung aus einer Hand. Unsere Geschichte, unsere Werte und unser Team.",
      eyebrow: "Über Empria Tech",
      title: "Digitale Arbeit mit",
      accent: "Klarheit und Substanz.",
      intro: "Empria Tech ist die Digitalmarke der MEDIA MARKETING LTD. Wir entwickeln Websites, Google-SEO-Strategien, Digital-Marketing und Apps für Unternehmen, die online professionell auftreten und nachhaltig wachsen wollen.",
      imageAlt: "Team der Digitalagentur arbeitet gemeinsam an Website-Layouts und SEO-Auswertungen an einem großen Bildschirm",
      story: {
        eyebrow: "Unsere Geschichte",
        title: "Eine Agentur, die Disziplinen verbindet, statt sie zu trennen.",
        paragraphs: [
          "Empria Tech arbeitet für Unternehmen, die ihre digitale Präsenz ernst nehmen. Hinter Empria Tech steht die MEDIA MARKETING LTD – ein Unternehmen, das digitale Projekte von der ersten Idee bis zur laufenden Betreuung begleitet.",
          "Unser Ansatz entstand aus einer einfachen Beobachtung: Websites, Suchmaschinenoptimierung und Marketing werden oft von unterschiedlichen Stellen getrennt voneinander behandelt. Das Ergebnis sind Auftritte, die gut aussehen, aber nicht gefunden werden – oder gefunden werden, aber nicht überzeugen.",
          "Deshalb verbinden wir bei Empria Tech Gestaltung, Technik und Marketing zu einem zusammenhängenden Prozess. Eine Website wird bei uns von Anfang an so geplant, dass sie von Menschen geschätzt und von Suchmaschinen verstanden wird. Kampagnen und Inhalte bauen auf dieser Grundlage auf, statt dagegen zu arbeiten.",
          "Dieselbe Logik führt unsere Arbeit in der App-Entwicklung: Digitale Produkte sollen eine klare Aufgabe erfüllen, stabil laufen und über die Zeit hinweg weiterwachsen können.",
        ],
      },
      values: {
        eyebrow: "Unsere Werte",
        title: "Woran wir uns bei jedem Projekt messen lassen.",
        items: [
          { title: "Klarheit", body: "Verständliche Sprache, klare Strukturen und nachvollziehbare Entscheidungen – auf der Website genauso wie in der Zusammenarbeit." },
          { title: "Substanz vor Schein", body: "Wir bauen keine Effekte für den Moment, sondern Grundlagen, die tragen: sauberer Code, ehrliche Inhalte, belastbare Strategien." },
          { title: "Transparenz", body: "Sie wissen, was wir tun, warum wir es tun und was es bringt. Keine unklaren Versprechen, keine Blackbox." },
          { title: "Langfristigkeit", body: "Organisches Wachstum schlägt Kurzfristigkeit. Wir denken Projekte so, dass sie über Jahre hinweg Wert bringen." },
        ],
      },
      team: {
        eyebrow: "Unser Team",
        title: "Kleine Strukturen, klare Verantwortung.",
        body: "Bei Empria Tech arbeiten Spezialisten eng zusammen, statt Aufgaben zwischen Agenturen und Dienstleistern hin und her zu reichen. Design, Entwicklung, SEO und Marketing greifen direkt ineinander – mit kurzen Wegen und klaren Ansprechpartnern.",
        roles: [
          { title: "Design & UX", body: "Gestaltung von Auftritten, die Orientierung schaffen und Marken glaubwürdig präsentieren – vom ersten Eindruck bis zur Anfrage." },
          { title: "Entwicklung", body: "Saubere, performante Umsetzung von Websites und Apps für Smartphone, Tablet und Desktop." },
          { title: "SEO & Marketing", body: "Keyword- und Marktanalysen, technische Optimierung und koordinierte Kampagnen für nachhaltige Sichtbarkeit." },
          { title: "Projektleitung", body: "Struktur, Kommunikation und Verlässlichkeit über den gesamten Projektverlauf – von der Planung bis zur Betreuung." },
        ],
        note: "Detaillierte Teamprofile folgen in Kürze.",
      },
      cta: {
        title: "Lernen Sie uns in einem Projekt kennen.",
        body: "Erzählen Sie uns von Ihrem Vorhaben – wir zeigen Ihnen, wie wir es mit Webdesign, Google SEO, Digital Marketing oder einer eigenen App umsetzen würden.",
        primary: "Kontakt aufnehmen",
        secondary: "Leistungen ansehen",
      },
    },
    en: {
      metaTitle: "About us — Empria Tech",
      metaDescription: "Empria Tech by MEDIA MARKETING LTD: web design, Google SEO, digital marketing and app development from one team. Our story, our values and our team.",
      eyebrow: "About Empria Tech",
      title: "Digital work with",
      accent: "clarity and substance.",
      intro: "Empria Tech is the digital brand of MEDIA MARKETING LTD. We build websites, Google SEO strategies, digital marketing and apps for companies that want a professional online presence and sustainable growth.",
      imageAlt: "Digital agency team collaborating on website layouts and SEO dashboards on a large screen",
      story: {
        eyebrow: "Our story",
        title: "One agency that connects disciplines instead of separating them.",
        paragraphs: [
          "Empria Tech works with companies that take their digital presence seriously. Behind Empria Tech stands MEDIA MARKETING LTD — a company that accompanies digital projects from the first idea through to ongoing support.",
          "Our approach grew out of a simple observation: websites, search engine optimization and marketing are often handled separately by different providers. The result is presences that look good but are never found — or are found but fail to convince.",
          "That is why at Empria Tech we combine design, technology and marketing into one connected process. From the very start, a website is planned so that people appreciate it and search engines understand it. Campaigns and content build on that foundation instead of working against it.",
          "The same logic drives our app development work: digital products should serve a clear purpose, run reliably and keep growing over time.",
        ],
      },
      values: {
        eyebrow: "Our values",
        title: "What we hold every project to.",
        items: [
          { title: "Clarity", body: "Understandable language, clear structures and comprehensible decisions — on the website just as much as in the way we work with you." },
          { title: "Substance over show", body: "We do not build effects for the moment, but foundations that last: clean code, honest content, dependable strategies." },
          { title: "Transparency", body: "You know what we are doing, why we are doing it and what it delivers. No vague promises, no black box." },
          { title: "Long-term thinking", body: "Organic growth beats short-term wins. We design projects to keep delivering value for years." },
        ],
      },
      team: {
        eyebrow: "Our team",
        title: "Small structures, clear responsibility.",
        body: "At Empria Tech, specialists work closely together instead of passing tasks back and forth between agencies and contractors. Design, development, SEO and marketing interlock directly — with short lines of communication and clear points of contact.",
        roles: [
          { title: "Design & UX", body: "Crafting presences that create orientation and present brands credibly — from first impression to enquiry." },
          { title: "Development", body: "Clean, performant implementation of websites and apps for smartphone, tablet and desktop." },
          { title: "SEO & Marketing", body: "Keyword and market analysis, technical optimization and coordinated campaigns for sustainable visibility." },
          { title: "Project management", body: "Structure, communication and reliability across the whole project — from planning to ongoing support." },
        ],
        note: "Detailed team profiles coming soon.",
      },
      cta: {
        title: "Get to know us in a project.",
        body: "Tell us about your plans — we will show you how we would approach them with web design, Google SEO, digital marketing or a dedicated app.",
        primary: "Contact us",
        secondary: "View services",
      },
    },
  } as Record<HomepageLanguage, AboutCopy>,
};
