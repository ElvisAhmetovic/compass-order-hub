// Simple translation service using Google Translate-like mapping
// This is a basic implementation - in production you'd use a real translation API

// Multi-language translation mappings
const languageMappings: Record<string, Record<string, string>> = {
  // Dutch to other languages
  'offerte': { 'fr': 'devis', 'en': 'quote', 'de': 'angebot', 'es': 'presupuesto' },
  'voorstel': { 'fr': 'proposition', 'en': 'proposal', 'de': 'vorschlag', 'es': 'propuesta' },
  'beschrijving': { 'fr': 'description', 'en': 'description', 'de': 'beschreibung', 'es': 'descripción' },
  'pakket': { 'fr': 'forfait', 'en': 'package', 'de': 'paket', 'es': 'paquete' },
  'service': { 'fr': 'service', 'en': 'service', 'de': 'dienstleistung', 'es': 'servicio' },
  'google': { 'fr': 'google', 'en': 'google', 'de': 'google', 'es': 'google' },
  'zilver': { 'fr': 'argent', 'en': 'silver', 'de': 'silber', 'es': 'plata' },
  'goud': { 'fr': 'or', 'en': 'gold', 'de': 'gold', 'es': 'oro' },
  'premium': { 'fr': 'premium', 'en': 'premium', 'de': 'premium', 'es': 'premium' },
  'bedrijf': { 'fr': 'entreprise', 'en': 'company', 'de': 'unternehmen', 'es': 'empresa' },
  'prijs': { 'fr': 'prix', 'en': 'price', 'de': 'preis', 'es': 'precio' },
  'maand': { 'fr': 'mois', 'en': 'month', 'de': 'monat', 'es': 'mes' },
  'jaar': { 'fr': 'année', 'en': 'year', 'de': 'jahr', 'es': 'año' },
  'inclusief': { 'fr': 'inclus', 'en': 'including', 'de': 'inklusive', 'es': 'incluyendo' },
  'exclusief': { 'fr': 'exclusif', 'en': 'excluding', 'de': 'exklusive', 'es': 'excluyendo' },
  'btw': { 'fr': 'tva', 'en': 'vat', 'de': 'mwst', 'es': 'iva' },
  'totaal': { 'fr': 'total', 'en': 'total', 'de': 'gesamt', 'es': 'total' },
  'website': { 'fr': 'site web', 'en': 'website', 'de': 'webseite', 'es': 'sitio web' },
  'ontwerp': { 'fr': 'conception', 'en': 'design', 'de': 'design', 'es': 'diseño' },
  'onderhoud': { 'fr': 'maintenance', 'en': 'maintenance', 'de': 'wartung', 'es': 'mantenimiento' },
  'hosting': { 'fr': 'hébergement', 'en': 'hosting', 'de': 'hosting', 'es': 'alojamiento' },
  'domein': { 'fr': 'domaine', 'en': 'domain', 'de': 'domain', 'es': 'dominio' },
  'ssl': { 'fr': 'ssl', 'en': 'ssl', 'de': 'ssl', 'es': 'ssl' },
  'beveiliging': { 'fr': 'sécurité', 'en': 'security', 'de': 'sicherheit', 'es': 'seguridad' },
  'backup': { 'fr': 'sauvegarde', 'en': 'backup', 'de': 'backup', 'es': 'copia de seguridad' },
  'analytics': { 'fr': 'analytiques', 'en': 'analytics', 'de': 'analytics', 'es': 'analítica' },
  'seo': { 'fr': 'seo', 'en': 'seo', 'de': 'seo', 'es': 'seo' },
  'marketing': { 'fr': 'marketing', 'en': 'marketing', 'de': 'marketing', 'es': 'marketing' },
  'media': { 'fr': 'médias', 'en': 'media', 'de': 'medien', 'es': 'medios' },
  'team': { 'fr': 'équipe', 'en': 'team', 'de': 'team', 'es': 'equipo' },
  'contact': { 'fr': 'contact', 'en': 'contact', 'de': 'kontakt', 'es': 'contacto' },
  'telefoon': { 'fr': 'téléphone', 'en': 'phone', 'de': 'telefon', 'es': 'teléfono' },
  'email': { 'fr': 'email', 'en': 'email', 'de': 'email', 'es': 'email' },
  'adres': { 'fr': 'adresse', 'en': 'address', 'de': 'adresse', 'es': 'dirección' },
  'stad': { 'fr': 'ville', 'en': 'city', 'de': 'stadt', 'es': 'ciudad' },
  'land': { 'fr': 'pays', 'en': 'country', 'de': 'land', 'es': 'país' },
  'postcode': { 'fr': 'code postal', 'en': 'postal code', 'de': 'postleitzahl', 'es': 'código postal' },
  
  // English to other languages (keeping original functionality)
  'quote': { 'fr': 'devis', 'nl': 'offerte', 'de': 'angebot', 'es': 'presupuesto' },
  'proposal': { 'fr': 'proposition', 'nl': 'voorstel', 'de': 'vorschlag', 'es': 'propuesta' },
  'description_en': { 'fr': 'description', 'nl': 'beschrijving', 'de': 'beschreibung', 'es': 'descripción' },
  'package': { 'fr': 'forfait', 'nl': 'pakket', 'de': 'paket', 'es': 'paquete' },
  'service_en': { 'fr': 'service', 'nl': 'service', 'de': 'dienstleistung', 'es': 'servicio' },
  'google_en': { 'fr': 'google', 'nl': 'google', 'de': 'google', 'es': 'google' },
  'silver': { 'fr': 'argent', 'nl': 'zilver', 'de': 'silber', 'es': 'plata' },
  'gold_en': { 'fr': 'or', 'nl': 'goud', 'de': 'gold', 'es': 'oro' },
  'premium_en': { 'fr': 'premium', 'nl': 'premium', 'de': 'premium', 'es': 'premium' },
  
  // French to other languages
  'devis': { 'nl': 'offerte', 'en': 'quote', 'de': 'angebot', 'es': 'presupuesto' },
  'proposition': { 'nl': 'voorstel', 'en': 'proposal', 'de': 'vorschlag', 'es': 'propuesta' },
  'forfait': { 'nl': 'pakket', 'en': 'package', 'de': 'paket', 'es': 'paquete' },
  'argent': { 'nl': 'zilver', 'en': 'silver', 'de': 'silber', 'es': 'plata' },
  'or': { 'nl': 'goud', 'en': 'gold', 'de': 'gold', 'es': 'oro' },
  
  // German to other languages
  'angebot': { 'nl': 'offerte', 'en': 'quote', 'fr': 'devis', 'es': 'presupuesto' },
  'vorschlag': { 'nl': 'voorstel', 'en': 'proposal', 'fr': 'proposition', 'es': 'propuesta' },
  'paket': { 'nl': 'pakket', 'en': 'package', 'fr': 'forfait', 'es': 'paquete' },
  'silber': { 'nl': 'zilver', 'en': 'silver', 'fr': 'argent', 'es': 'plata' },
  'gold_de': { 'nl': 'goud', 'en': 'gold', 'fr': 'or', 'es': 'oro' }
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