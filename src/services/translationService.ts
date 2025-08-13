// Simple translation service using Google Translate-like mapping
// This is a basic implementation - in production you'd use a real translation API

const translations: Record<string, Record<string, string>> = {
  // Common business terms
  'Quote': {
    'de': 'Angebot',
    'fr': 'Devis',
    'es': 'Presupuesto',
    'it': 'Preventivo',
    'nl': 'Offerte',
    'pt': 'Orçamento'
  },
  'Proposal': {
    'de': 'Vorschlag',
    'fr': 'Proposition',
    'es': 'Propuesta',
    'it': 'Proposta',
    'nl': 'Voorstel',
    'pt': 'Proposta'
  },
  'Description': {
    'de': 'Beschreibung',
    'fr': 'Description',
    'es': 'Descripción',
    'it': 'Descrizione',
    'nl': 'Beschrijving',
    'pt': 'Descrição'
  },
  'Package': {
    'de': 'Paket',
    'fr': 'Forfait',
    'es': 'Paquete',
    'it': 'Pacchetto',
    'nl': 'Pakket',
    'pt': 'Pacote'
  },
  'Service': {
    'de': 'Dienstleistung',
    'fr': 'Service',
    'es': 'Servicio',
    'it': 'Servizio',
    'nl': 'Service',
    'pt': 'Serviço'
  },
  'Google': {
    'de': 'Google',
    'fr': 'Google',
    'es': 'Google',
    'it': 'Google',
    'nl': 'Google',
    'pt': 'Google'
  },
  'Silver': {
    'de': 'Silber',
    'fr': 'Argent',
    'es': 'Plata',
    'it': 'Argento',
    'nl': 'Zilver',
    'pt': 'Prata'
  },
  'Gold': {
    'de': 'Gold',
    'fr': 'Or',
    'es': 'Oro',
    'it': 'Oro',
    'nl': 'Goud',
    'pt': 'Ouro'
  },
  'Premium': {
    'de': 'Premium',
    'fr': 'Premium',
    'es': 'Premium',
    'it': 'Premium',
    'nl': 'Premium',
    'pt': 'Premium'
  }
};

// Fallback translation using basic word mapping
const translateText = (text: string, targetLanguage: string): string => {
  if (!text || targetLanguage === 'en') return text;
  
  let translatedText = text;
  
  // Replace known words
  Object.entries(translations).forEach(([english, langMap]) => {
    if (langMap[targetLanguage]) {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedText = translatedText.replace(regex, langMap[targetLanguage]);
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
  
  // Translate text fields
  for (const field of fieldsToTranslate) {
    if (translatedData[field]) {
      translatedData[field] = await translateProposalContent(
        translatedData[field],
        'en',
        targetLanguage
      );
    }
  }
  
  // Translate line items
  if (translatedData.lineItems) {
    translatedData.lineItems = await Promise.all(
      translatedData.lineItems.map(async (item: any) => ({
        ...item,
        name: await translateProposalContent(item.name, 'en', targetLanguage),
        description: await translateProposalContent(item.description, 'en', targetLanguage),
      }))
    );
  }
  
  return translatedData;
};