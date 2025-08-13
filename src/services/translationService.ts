// Simple translation service using Google Translate-like mapping
// This is a basic implementation - in production you'd use a real translation API

// Comprehensive multi-language translation mappings for all supported languages
const languageMappings: Record<string, Record<string, string>> = {
  // Common business terms - universal translations
  'offerte': { 'fr': 'devis', 'en': 'quote', 'de': 'angebot', 'es': 'presupuesto', 'cs': 'nabídka', 'sv': 'offert', 'no': 'tilbud', 'da': 'tilbud' },
  'quote': { 'fr': 'devis', 'nl': 'offerte', 'de': 'angebot', 'es': 'presupuesto', 'cs': 'nabídka', 'sv': 'offert', 'no': 'tilbud', 'da': 'tilbud' },
  'devis': { 'nl': 'offerte', 'en': 'quote', 'de': 'angebot', 'es': 'presupuesto', 'cs': 'nabídka', 'sv': 'offert', 'no': 'tilbud', 'da': 'tilbud' },
  'angebot': { 'nl': 'offerte', 'en': 'quote', 'fr': 'devis', 'es': 'presupuesto', 'cs': 'nabídka', 'sv': 'offert', 'no': 'tilbud', 'da': 'tilbud' },
  'presupuesto': { 'nl': 'offerte', 'en': 'quote', 'fr': 'devis', 'de': 'angebot', 'cs': 'nabídka', 'sv': 'offert', 'no': 'tilbud', 'da': 'tilbud' },
  'nabídka': { 'nl': 'offerte', 'en': 'quote', 'fr': 'devis', 'de': 'angebot', 'es': 'presupuesto', 'sv': 'offert', 'no': 'tilbud', 'da': 'tilbud' },
  'offert': { 'nl': 'offerte', 'en': 'quote', 'fr': 'devis', 'de': 'angebot', 'es': 'presupuesto', 'cs': 'nabídka', 'no': 'tilbud', 'da': 'tilbud' },
  'tilbud': { 'nl': 'offerte', 'en': 'quote', 'fr': 'devis', 'de': 'angebot', 'es': 'presupuesto', 'cs': 'nabídka', 'sv': 'offert' },

  // Proposal/Suggestion
  'voorstel': { 'fr': 'proposition', 'en': 'proposal', 'de': 'vorschlag', 'es': 'propuesta', 'cs': 'návrh', 'sv': 'förslag', 'no': 'forslag', 'da': 'forslag' },
  'proposal': { 'fr': 'proposition', 'nl': 'voorstel', 'de': 'vorschlag', 'es': 'propuesta', 'cs': 'návrh', 'sv': 'förslag', 'no': 'forslag', 'da': 'forslag' },
  'proposition': { 'nl': 'voorstel', 'en': 'proposal', 'de': 'vorschlag', 'es': 'propuesta', 'cs': 'návrh', 'sv': 'förslag', 'no': 'forslag', 'da': 'forslag' },
  'vorschlag': { 'nl': 'voorstel', 'en': 'proposal', 'fr': 'proposition', 'es': 'propuesta', 'cs': 'návrh', 'sv': 'förslag', 'no': 'forslag', 'da': 'forslag' },
  'propuesta': { 'nl': 'voorstel', 'en': 'proposal', 'fr': 'proposition', 'de': 'vorschlag', 'cs': 'návrh', 'sv': 'förslag', 'no': 'forslag', 'da': 'forslag' },
  'návrh': { 'nl': 'voorstel', 'en': 'proposal', 'fr': 'proposition', 'de': 'vorschlag', 'es': 'propuesta', 'sv': 'förslag', 'no': 'forslag', 'da': 'forslag' },
  'förslag': { 'nl': 'voorstel', 'en': 'proposal', 'fr': 'proposition', 'de': 'vorschlag', 'es': 'propuesta', 'cs': 'návrh', 'no': 'forslag', 'da': 'forslag' },
  'forslag': { 'nl': 'voorstel', 'en': 'proposal', 'fr': 'proposition', 'de': 'vorschlag', 'es': 'propuesta', 'cs': 'návrh', 'sv': 'förslag' },

  // Description
  'beschrijving': { 'fr': 'description', 'en': 'description', 'de': 'beschreibung', 'es': 'descripción', 'cs': 'popis', 'sv': 'beskrivning', 'no': 'beskrivelse', 'da': 'beskrivelse' },
  'description': { 'fr': 'description', 'nl': 'beschrijving', 'de': 'beschreibung', 'es': 'descripción', 'cs': 'popis', 'sv': 'beskrivning', 'no': 'beskrivelse', 'da': 'beskrivelse' },
  'beschreibung': { 'nl': 'beschrijving', 'en': 'description', 'fr': 'description', 'es': 'descripción', 'cs': 'popis', 'sv': 'beskrivning', 'no': 'beskrivelse', 'da': 'beskrivelse' },
  'descripción': { 'nl': 'beschrijving', 'en': 'description', 'fr': 'description', 'de': 'beschreibung', 'cs': 'popis', 'sv': 'beskrivning', 'no': 'beskrivelse', 'da': 'beskrivelse' },
  'popis': { 'nl': 'beschrijving', 'en': 'description', 'fr': 'description', 'de': 'beschreibung', 'es': 'descripción', 'sv': 'beskrivning', 'no': 'beskrivelse', 'da': 'beskrivelse' },
  'beskrivning': { 'nl': 'beschrijving', 'en': 'description', 'fr': 'description', 'de': 'beschreibung', 'es': 'descripción', 'cs': 'popis', 'no': 'beskrivelse', 'da': 'beskrivelse' },
  'beskrivelse': { 'nl': 'beschrijving', 'en': 'description', 'fr': 'description', 'de': 'beschreibung', 'es': 'descripción', 'cs': 'popis', 'sv': 'beskrivning' },

  // Package
  'pakket': { 'fr': 'forfait', 'en': 'package', 'de': 'paket', 'es': 'paquete', 'cs': 'balíček', 'sv': 'paket', 'no': 'pakke', 'da': 'pakke' },
  'package': { 'fr': 'forfait', 'nl': 'pakket', 'de': 'paket', 'es': 'paquete', 'cs': 'balíček', 'sv': 'paket', 'no': 'pakke', 'da': 'pakke' },
  'forfait': { 'nl': 'pakket', 'en': 'package', 'de': 'paket', 'es': 'paquete', 'cs': 'balíček', 'sv': 'paket', 'no': 'pakke', 'da': 'pakke' },
  'paket': { 'nl': 'pakket', 'en': 'package', 'fr': 'forfait', 'es': 'paquete', 'cs': 'balíček', 'sv': 'paket', 'no': 'pakke', 'da': 'pakke' },
  'paquete': { 'nl': 'pakket', 'en': 'package', 'fr': 'forfait', 'de': 'paket', 'cs': 'balíček', 'sv': 'paket', 'no': 'pakke', 'da': 'pakke' },
  'balíček': { 'nl': 'pakket', 'en': 'package', 'fr': 'forfait', 'de': 'paket', 'es': 'paquete', 'sv': 'paket', 'no': 'pakke', 'da': 'pakke' },
  'pakke': { 'nl': 'pakket', 'en': 'package', 'fr': 'forfait', 'de': 'paket', 'es': 'paquete', 'cs': 'balíček', 'sv': 'paket' },

  // Service
  'service': { 'fr': 'service', 'en': 'service', 'de': 'dienstleistung', 'es': 'servicio', 'cs': 'služba', 'sv': 'tjänst', 'no': 'tjeneste', 'da': 'service' },
  'dienstleistung': { 'nl': 'service', 'en': 'service', 'fr': 'service', 'es': 'servicio', 'cs': 'služba', 'sv': 'tjänst', 'no': 'tjeneste', 'da': 'service' },
  'servicio': { 'nl': 'service', 'en': 'service', 'fr': 'service', 'de': 'dienstleistung', 'cs': 'služba', 'sv': 'tjänst', 'no': 'tjeneste', 'da': 'service' },
  'služba': { 'nl': 'service', 'en': 'service', 'fr': 'service', 'de': 'dienstleistung', 'es': 'servicio', 'sv': 'tjänst', 'no': 'tjeneste', 'da': 'service' },
  'tjänst': { 'nl': 'service', 'en': 'service', 'fr': 'service', 'de': 'dienstleistung', 'es': 'servicio', 'cs': 'služba', 'no': 'tjeneste', 'da': 'service' },
  'tjeneste': { 'nl': 'service', 'en': 'service', 'fr': 'service', 'de': 'dienstleistung', 'es': 'servicio', 'cs': 'služba', 'sv': 'tjänst', 'da': 'service' },

  // Colors/Premium levels
  'zilver': { 'fr': 'argent', 'en': 'silver', 'de': 'silber', 'es': 'plata', 'cs': 'stříbrný', 'sv': 'silver', 'no': 'sølv', 'da': 'sølv' },
  'silver': { 'fr': 'argent', 'nl': 'zilver', 'de': 'silber', 'es': 'plata', 'cs': 'stříbrný', 'sv': 'silver', 'no': 'sølv', 'da': 'sølv' },
  'argent': { 'nl': 'zilver', 'en': 'silver', 'de': 'silber', 'es': 'plata', 'cs': 'stříbrný', 'sv': 'silver', 'no': 'sølv', 'da': 'sølv' },
  'silber': { 'nl': 'zilver', 'en': 'silver', 'fr': 'argent', 'es': 'plata', 'cs': 'stříbrný', 'sv': 'silver', 'no': 'sølv', 'da': 'sølv' },
  'plata': { 'nl': 'zilver', 'en': 'silver', 'fr': 'argent', 'de': 'silber', 'cs': 'stříbrný', 'sv': 'silver', 'no': 'sølv', 'da': 'sølv' },
  'stříbrný': { 'nl': 'zilver', 'en': 'silver', 'fr': 'argent', 'de': 'silber', 'es': 'plata', 'sv': 'silver', 'no': 'sølv', 'da': 'sølv' },
  'sølv': { 'nl': 'zilver', 'en': 'silver', 'fr': 'argent', 'de': 'silber', 'es': 'plata', 'cs': 'stříbrný', 'sv': 'silver' },

  'goud': { 'fr': 'or', 'en': 'gold', 'de': 'gold', 'es': 'oro', 'cs': 'zlatý', 'sv': 'guld', 'no': 'gull', 'da': 'guld' },
  'gold': { 'fr': 'or', 'nl': 'goud', 'de': 'gold', 'es': 'oro', 'cs': 'zlatý', 'sv': 'guld', 'no': 'gull', 'da': 'guld' },
  'or': { 'nl': 'goud', 'en': 'gold', 'de': 'gold', 'es': 'oro', 'cs': 'zlatý', 'sv': 'guld', 'no': 'gull', 'da': 'guld' },
  'oro': { 'nl': 'goud', 'en': 'gold', 'fr': 'or', 'de': 'gold', 'cs': 'zlatý', 'sv': 'guld', 'no': 'gull', 'da': 'guld' },
  'zlatý': { 'nl': 'goud', 'en': 'gold', 'fr': 'or', 'de': 'gold', 'es': 'oro', 'sv': 'guld', 'no': 'gull', 'da': 'guld' },
  'guld': { 'nl': 'goud', 'en': 'gold', 'fr': 'or', 'de': 'gold', 'es': 'oro', 'cs': 'zlatý', 'no': 'gull' },
  'gull': { 'nl': 'goud', 'en': 'gold', 'fr': 'or', 'de': 'gold', 'es': 'oro', 'cs': 'zlatý', 'sv': 'guld', 'da': 'guld' },

  'premium': { 'fr': 'premium', 'en': 'premium', 'de': 'premium', 'es': 'premium', 'cs': 'premium', 'sv': 'premium', 'no': 'premium', 'da': 'premium' },

  // Company/Business
  'bedrijf': { 'fr': 'entreprise', 'en': 'company', 'de': 'unternehmen', 'es': 'empresa', 'cs': 'společnost', 'sv': 'företag', 'no': 'selskap', 'da': 'virksomhed' },
  'company': { 'fr': 'entreprise', 'nl': 'bedrijf', 'de': 'unternehmen', 'es': 'empresa', 'cs': 'společnost', 'sv': 'företag', 'no': 'selskap', 'da': 'virksomhed' },
  'entreprise': { 'nl': 'bedrijf', 'en': 'company', 'de': 'unternehmen', 'es': 'empresa', 'cs': 'společnost', 'sv': 'företag', 'no': 'selskap', 'da': 'virksomhed' },
  'unternehmen': { 'nl': 'bedrijf', 'en': 'company', 'fr': 'entreprise', 'es': 'empresa', 'cs': 'společnost', 'sv': 'företag', 'no': 'selskap', 'da': 'virksomhed' },
  'empresa': { 'nl': 'bedrijf', 'en': 'company', 'fr': 'entreprise', 'de': 'unternehmen', 'cs': 'společnost', 'sv': 'företag', 'no': 'selskap', 'da': 'virksomhed' },
  'společnost': { 'nl': 'bedrijf', 'en': 'company', 'fr': 'entreprise', 'de': 'unternehmen', 'es': 'empresa', 'sv': 'företag', 'no': 'selskap', 'da': 'virksomhed' },
  'företag': { 'nl': 'bedrijf', 'en': 'company', 'fr': 'entreprise', 'de': 'unternehmen', 'es': 'empresa', 'cs': 'společnost', 'no': 'selskap', 'da': 'virksomhed' },
  'selskap': { 'nl': 'bedrijf', 'en': 'company', 'fr': 'entreprise', 'de': 'unternehmen', 'es': 'empresa', 'cs': 'společnost', 'sv': 'företag', 'da': 'virksomhed' },
  'virksomhed': { 'nl': 'bedrijf', 'en': 'company', 'fr': 'entreprise', 'de': 'unternehmen', 'es': 'empresa', 'cs': 'společnost', 'sv': 'företag', 'no': 'selskap' },

  // Price/Cost
  'prijs': { 'fr': 'prix', 'en': 'price', 'de': 'preis', 'es': 'precio', 'cs': 'cena', 'sv': 'pris', 'no': 'pris', 'da': 'pris' },
  'price': { 'fr': 'prix', 'nl': 'prijs', 'de': 'preis', 'es': 'precio', 'cs': 'cena', 'sv': 'pris', 'no': 'pris', 'da': 'pris' },
  'prix': { 'nl': 'prijs', 'en': 'price', 'de': 'preis', 'es': 'precio', 'cs': 'cena', 'sv': 'pris', 'no': 'pris', 'da': 'pris' },
  'preis': { 'nl': 'prijs', 'en': 'price', 'fr': 'prix', 'es': 'precio', 'cs': 'cena', 'sv': 'pris', 'no': 'pris', 'da': 'pris' },
  'precio': { 'nl': 'prijs', 'en': 'price', 'fr': 'prix', 'de': 'preis', 'cs': 'cena', 'sv': 'pris', 'no': 'pris', 'da': 'pris' },
  'cena': { 'nl': 'prijs', 'en': 'price', 'fr': 'prix', 'de': 'preis', 'es': 'precio', 'sv': 'pris', 'no': 'pris', 'da': 'pris' },
  'pris': { 'nl': 'prijs', 'en': 'price', 'fr': 'prix', 'de': 'preis', 'es': 'precio', 'cs': 'cena' },

  // Time periods
  'maand': { 'fr': 'mois', 'en': 'month', 'de': 'monat', 'es': 'mes', 'cs': 'měsíc', 'sv': 'månad', 'no': 'måned', 'da': 'måned' },
  'month': { 'fr': 'mois', 'nl': 'maand', 'de': 'monat', 'es': 'mes', 'cs': 'měsíc', 'sv': 'månad', 'no': 'måned', 'da': 'måned' },
  'mois': { 'nl': 'maand', 'en': 'month', 'de': 'monat', 'es': 'mes', 'cs': 'měsíc', 'sv': 'månad', 'no': 'måned', 'da': 'måned' },
  'monat': { 'nl': 'maand', 'en': 'month', 'fr': 'mois', 'es': 'mes', 'cs': 'měsíc', 'sv': 'månad', 'no': 'måned', 'da': 'måned' },
  'mes': { 'nl': 'maand', 'en': 'month', 'fr': 'mois', 'de': 'monat', 'cs': 'měsíc', 'sv': 'månad', 'no': 'måned', 'da': 'måned' },
  'měsíc': { 'nl': 'maand', 'en': 'month', 'fr': 'mois', 'de': 'monat', 'es': 'mes', 'sv': 'månad', 'no': 'måned', 'da': 'måned' },
  'månad': { 'nl': 'maand', 'en': 'month', 'fr': 'mois', 'de': 'monat', 'es': 'mes', 'cs': 'měsíc', 'no': 'måned', 'da': 'måned' },
  'måned': { 'nl': 'maand', 'en': 'month', 'fr': 'mois', 'de': 'monat', 'es': 'mes', 'cs': 'měsíc', 'sv': 'månad' },

  'jaar': { 'fr': 'année', 'en': 'year', 'de': 'jahr', 'es': 'año', 'cs': 'rok', 'sv': 'år', 'no': 'år', 'da': 'år' },
  'year': { 'fr': 'année', 'nl': 'jaar', 'de': 'jahr', 'es': 'año', 'cs': 'rok', 'sv': 'år', 'no': 'år', 'da': 'år' },
  'année': { 'nl': 'jaar', 'en': 'year', 'de': 'jahr', 'es': 'año', 'cs': 'rok', 'sv': 'år', 'no': 'år', 'da': 'år' },
  'jahr': { 'nl': 'jaar', 'en': 'year', 'fr': 'année', 'es': 'año', 'cs': 'rok', 'sv': 'år', 'no': 'år', 'da': 'år' },
  'año': { 'nl': 'jaar', 'en': 'year', 'fr': 'année', 'de': 'jahr', 'cs': 'rok', 'sv': 'år', 'no': 'år', 'da': 'år' },
  'rok': { 'nl': 'jaar', 'en': 'year', 'fr': 'année', 'de': 'jahr', 'es': 'año', 'sv': 'år', 'no': 'år', 'da': 'år' },
  'år': { 'nl': 'jaar', 'en': 'year', 'fr': 'année', 'de': 'jahr', 'es': 'año', 'cs': 'rok' },

  // Including/Excluding
  'inclusief': { 'fr': 'inclus', 'en': 'including', 'de': 'inklusive', 'es': 'incluyendo', 'cs': 'včetně', 'sv': 'inklusive', 'no': 'inkludert', 'da': 'inklusive' },
  'including': { 'fr': 'inclus', 'nl': 'inclusief', 'de': 'inklusive', 'es': 'incluyendo', 'cs': 'včetně', 'sv': 'inklusive', 'no': 'inkludert', 'da': 'inklusive' },
  'inclus': { 'nl': 'inclusief', 'en': 'including', 'de': 'inklusive', 'es': 'incluyendo', 'cs': 'včetně', 'sv': 'inklusive', 'no': 'inkludert', 'da': 'inklusive' },
  'inklusive': { 'nl': 'inclusief', 'en': 'including', 'fr': 'inclus', 'es': 'incluyendo', 'cs': 'včetně', 'sv': 'inklusive', 'no': 'inkludert', 'da': 'inklusive' },
  'incluyendo': { 'nl': 'inclusief', 'en': 'including', 'fr': 'inclus', 'de': 'inklusive', 'cs': 'včetně', 'sv': 'inklusive', 'no': 'inkludert', 'da': 'inklusive' },
  'včetně': { 'nl': 'inclusief', 'en': 'including', 'fr': 'inclus', 'de': 'inklusive', 'es': 'incluyendo', 'sv': 'inklusive', 'no': 'inkludert', 'da': 'inklusive' },
  'inkludert': { 'nl': 'inclusief', 'en': 'including', 'fr': 'inclus', 'de': 'inklusive', 'es': 'incluyendo', 'cs': 'včetně', 'sv': 'inklusive', 'da': 'inklusive' },

  'exclusief': { 'fr': 'exclusif', 'en': 'excluding', 'de': 'exklusive', 'es': 'excluyendo', 'cs': 'výhradně', 'sv': 'exklusive', 'no': 'ekskludert', 'da': 'eksklusive' },
  'excluding': { 'fr': 'exclusif', 'nl': 'exclusief', 'de': 'exklusive', 'es': 'excluyendo', 'cs': 'výhradně', 'sv': 'exklusive', 'no': 'ekskludert', 'da': 'eksklusive' },
  'exclusif': { 'nl': 'exclusief', 'en': 'excluding', 'de': 'exklusive', 'es': 'excluyendo', 'cs': 'výhradně', 'sv': 'exklusive', 'no': 'ekskludert', 'da': 'eksklusive' },
  'exklusive': { 'nl': 'exclusief', 'en': 'excluding', 'fr': 'exclusif', 'es': 'excluyendo', 'cs': 'výhradně', 'sv': 'exklusive', 'no': 'ekskludert', 'da': 'eksklusive' },
  'excluyendo': { 'nl': 'exclusief', 'en': 'excluding', 'fr': 'exclusif', 'de': 'exklusive', 'cs': 'výhradně', 'sv': 'exklusive', 'no': 'ekskludert', 'da': 'eksklusive' },
  'výhradně': { 'nl': 'exclusief', 'en': 'excluding', 'fr': 'exclusif', 'de': 'exklusive', 'es': 'excluyendo', 'sv': 'exklusive', 'no': 'ekskludert', 'da': 'eksklusive' },
  'ekskludert': { 'nl': 'exclusief', 'en': 'excluding', 'fr': 'exclusif', 'de': 'exklusive', 'es': 'excluyendo', 'cs': 'výhradně', 'sv': 'exklusive', 'da': 'eksklusive' },
  'eksklusive': { 'nl': 'exclusief', 'en': 'excluding', 'fr': 'exclusif', 'de': 'exklusive', 'es': 'excluyendo', 'cs': 'výhradně', 'sv': 'exklusive', 'no': 'ekskludert' },

  // VAT/Tax terms
  'btw': { 'fr': 'tva', 'en': 'vat', 'de': 'mwst', 'es': 'iva', 'cs': 'dph', 'sv': 'moms', 'no': 'mva', 'da': 'moms' },
  'vat': { 'fr': 'tva', 'nl': 'btw', 'de': 'mwst', 'es': 'iva', 'cs': 'dph', 'sv': 'moms', 'no': 'mva', 'da': 'moms' },
  'tva': { 'nl': 'btw', 'en': 'vat', 'de': 'mwst', 'es': 'iva', 'cs': 'dph', 'sv': 'moms', 'no': 'mva', 'da': 'moms' },
  'mwst': { 'nl': 'btw', 'en': 'vat', 'fr': 'tva', 'es': 'iva', 'cs': 'dph', 'sv': 'moms', 'no': 'mva', 'da': 'moms' },
  'iva': { 'nl': 'btw', 'en': 'vat', 'fr': 'tva', 'de': 'mwst', 'cs': 'dph', 'sv': 'moms', 'no': 'mva', 'da': 'moms' },
  'dph': { 'nl': 'btw', 'en': 'vat', 'fr': 'tva', 'de': 'mwst', 'es': 'iva', 'sv': 'moms', 'no': 'mva', 'da': 'moms' },
  'moms': { 'nl': 'btw', 'en': 'vat', 'fr': 'tva', 'de': 'mwst', 'es': 'iva', 'cs': 'dph', 'no': 'mva' },
  'mva': { 'nl': 'btw', 'en': 'vat', 'fr': 'tva', 'de': 'mwst', 'es': 'iva', 'cs': 'dph', 'sv': 'moms', 'da': 'moms' },

  // Total
  'totaal': { 'fr': 'total', 'en': 'total', 'de': 'gesamt', 'es': 'total', 'cs': 'celkem', 'sv': 'totalt', 'no': 'totalt', 'da': 'total' },
  'total': { 'fr': 'total', 'nl': 'totaal', 'de': 'gesamt', 'es': 'total', 'cs': 'celkem', 'sv': 'totalt', 'no': 'totalt', 'da': 'total' },
  'gesamt': { 'nl': 'totaal', 'en': 'total', 'fr': 'total', 'es': 'total', 'cs': 'celkem', 'sv': 'totalt', 'no': 'totalt', 'da': 'total' },
  'celkem': { 'nl': 'totaal', 'en': 'total', 'fr': 'total', 'de': 'gesamt', 'es': 'total', 'sv': 'totalt', 'no': 'totalt', 'da': 'total' },
  'totalt': { 'nl': 'totaal', 'en': 'total', 'fr': 'total', 'de': 'gesamt', 'es': 'total', 'cs': 'celkem', 'da': 'total' },

  // Website/Technology terms
  'website': { 'fr': 'site web', 'en': 'website', 'de': 'webseite', 'es': 'sitio web', 'cs': 'webová stránka', 'sv': 'webbplats', 'no': 'nettside', 'da': 'hjemmeside' },
  'webseite': { 'nl': 'website', 'en': 'website', 'fr': 'site web', 'es': 'sitio web', 'cs': 'webová stránka', 'sv': 'webbplats', 'no': 'nettside', 'da': 'hjemmeside' },
  'webbplats': { 'nl': 'website', 'en': 'website', 'fr': 'site web', 'de': 'webseite', 'es': 'sitio web', 'cs': 'webová stránka', 'no': 'nettside', 'da': 'hjemmeside' },
  'nettside': { 'nl': 'website', 'en': 'website', 'fr': 'site web', 'de': 'webseite', 'es': 'sitio web', 'cs': 'webová stránka', 'sv': 'webbplats', 'da': 'hjemmeside' },
  'hjemmeside': { 'nl': 'website', 'en': 'website', 'fr': 'site web', 'de': 'webseite', 'es': 'sitio web', 'cs': 'webová stránka', 'sv': 'webbplats', 'no': 'nettside' },

  'ontwerp': { 'fr': 'conception', 'en': 'design', 'de': 'design', 'es': 'diseño', 'cs': 'návrh', 'sv': 'design', 'no': 'design', 'da': 'design' },
  'design': { 'fr': 'conception', 'nl': 'ontwerp', 'de': 'design', 'es': 'diseño', 'cs': 'návrh', 'sv': 'design', 'no': 'design', 'da': 'design' },
  'conception': { 'nl': 'ontwerp', 'en': 'design', 'de': 'design', 'es': 'diseño', 'cs': 'návrh', 'sv': 'design', 'no': 'design', 'da': 'design' },
  'diseño': { 'nl': 'ontwerp', 'en': 'design', 'fr': 'conception', 'de': 'design', 'cs': 'návrh', 'sv': 'design', 'no': 'design', 'da': 'design' },

  'onderhoud': { 'fr': 'maintenance', 'en': 'maintenance', 'de': 'wartung', 'es': 'mantenimiento', 'cs': 'údržba', 'sv': 'underhåll', 'no': 'vedlikehold', 'da': 'vedligeholdelse' },
  'maintenance': { 'fr': 'maintenance', 'nl': 'onderhoud', 'de': 'wartung', 'es': 'mantenimiento', 'cs': 'údržba', 'sv': 'underhåll', 'no': 'vedlikehold', 'da': 'vedligeholdelse' },
  'wartung': { 'nl': 'onderhoud', 'en': 'maintenance', 'fr': 'maintenance', 'es': 'mantenimiento', 'cs': 'údržba', 'sv': 'underhåll', 'no': 'vedlikehold', 'da': 'vedligeholdelse' },
  'mantenimiento': { 'nl': 'onderhoud', 'en': 'maintenance', 'fr': 'maintenance', 'de': 'wartung', 'cs': 'údržba', 'sv': 'underhåll', 'no': 'vedlikehold', 'da': 'vedligeholdelse' },
  'údržba': { 'nl': 'onderhoud', 'en': 'maintenance', 'fr': 'maintenance', 'de': 'wartung', 'es': 'mantenimiento', 'sv': 'underhåll', 'no': 'vedlikehold', 'da': 'vedligeholdelse' },
  'underhåll': { 'nl': 'onderhoud', 'en': 'maintenance', 'fr': 'maintenance', 'de': 'wartung', 'es': 'mantenimiento', 'cs': 'údržba', 'no': 'vedlikehold', 'da': 'vedligeholdelse' },
  'vedlikehold': { 'nl': 'onderhoud', 'en': 'maintenance', 'fr': 'maintenance', 'de': 'wartung', 'es': 'mantenimiento', 'cs': 'údržba', 'sv': 'underhåll', 'da': 'vedligeholdelse' },
  'vedligeholdelse': { 'nl': 'onderhoud', 'en': 'maintenance', 'fr': 'maintenance', 'de': 'wartung', 'es': 'mantenimiento', 'cs': 'údržba', 'sv': 'underhåll', 'no': 'vedlikehold' }
};

// Advanced translation using multi-language mapping
const translateText = (text: string, targetLanguage: string): string => {
  if (!text || targetLanguage === 'en') return text;
  
  let translatedText = text;
  
  // Replace known words from any source language to target language
  Object.entries(languageMappings).forEach(([sourceWord, translations]) => {
    if (translations[targetLanguage]) {
      // Create case-insensitive regex that matches whole words
      const regex = new RegExp(`\\b${sourceWord}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translations[targetLanguage]);
    }
  });
  
  return translatedText;
};

// Main translation function
export const translateProposalContent = (content: string, fromLanguage: string, toLanguage: string): Promise<string> => {
  return new Promise((resolve) => {
    // For now, use basic word replacement
    // In production, you would integrate with Google Translate API or similar
    const translated = translateText(content, toLanguage);
    
    // Simulate API delay
    setTimeout(() => {
      resolve(translated);
    }, 100);
  });
};

// Helper to translate an entire proposal object
export const translateProposalData = async (proposalData: any, targetLanguage: string) => {
  if (targetLanguage === 'en') return proposalData;
  
  const fieldsToTranslate = [
    'proposalTitle',
    'proposalDescription', 
    'content',
    'deliveryTerms',
    'paymentTerms',
    'termsAndConditions',
    'footerContent'
  ];
  
  const translatedData = { ...proposalData };
  
  // Translate text fields (from any source language to target language)
  for (const field of fieldsToTranslate) {
    if (translatedData[field]) {
      translatedData[field] = await translateProposalContent(
        translatedData[field],
        'auto', // Auto-detect source language
        targetLanguage
      );
    }
  }
  
  // Translate line items
  if (translatedData.lineItems) {
    translatedData.lineItems = await Promise.all(
      translatedData.lineItems.map(async (item: any) => ({
        ...item,
        name: await translateProposalContent(item.name, 'auto', targetLanguage),
        description: await translateProposalContent(item.description, 'auto', targetLanguage),
      }))
    );
  }
  
  return translatedData;
};