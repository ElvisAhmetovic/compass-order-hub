export interface PredefinedPackage {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  
  // Complete proposal template data
  proposalTitle: string;
  proposalTitleTranslations: Record<string, string>;
  proposalDescription: string;
  proposalDescriptionTranslations: Record<string, string>;
  
  // VAT settings
  vatEnabled: boolean;
  vatRate: number;
  
  // Terms
  deliveryTerms: string;
  deliveryTermsTranslations: Record<string, string>;
  paymentTerms: string;
  paymentTermsTranslations: Record<string, string>;
  
  // Footer content
  footerContent: string;
  footerContentTranslations: Record<string, string>;
  
  // Line item data
  lineItems: Array<{
    name: string;
    nameTranslations: Record<string, string>;
    description: string;
    descriptionTranslations: Record<string, string>;
    quantity: number;
    unitPrice: number;
    unit: string;
    unitTranslations: Record<string, string>;
    category: string;
  }>;
}

export const PREDEFINED_PACKAGES: PredefinedPackage[] = [
  {
    id: "google-zilver-pakket",
    name: "GOOGLE ZILVER PAKKET (€250)",
    nameTranslations: {
      en: "GOOGLE SILVER PACKAGE (€250)",
      de: "GOOGLE SILBER PAKET (€250)",
      fr: "FORFAIT GOOGLE ARGENT (€250)",
      es: "PAQUETE GOOGLE PLATA (€250)",
      it: "PACCHETTO GOOGLE ARGENTO (€250)",
      pt: "PACOTE GOOGLE PRATA (€250)",
      nl: "GOOGLE ZILVER PAKKET (€250)"
    },
    proposalTitle: "Bescherm uw online REPUTATIE!",
    proposalTitleTranslations: {
      en: "Protect your online REPUTATION!",
      de: "Schützen Sie Ihren Online-RUF!",
      fr: "Protégez votre RÉPUTATION en ligne!",
      es: "¡Protege tu REPUTACIÓN en línea!",
      it: "Proteggi la tua REPUTAZIONE online!",
      pt: "Proteja sua REPUTAÇÃO online!",
      nl: "Bescherm uw online REPUTATIE!"
    },
    proposalDescription: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding.",
    proposalDescriptionTranslations: {
      en: "Thank you for your inquiry. We are happy to provide you with the requested non-binding offer.",
      de: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
      fr: "Merci pour votre demande. Nous sommes heureux de vous fournir l'offre non contraignante demandée.",
      es: "Gracias por su consulta. Estamos encantados de proporcionarle la oferta no vinculante solicitada.",
      it: "Grazie per la sua richiesta. Siamo felici di fornirle l'offerta non vincolante richiesta.",
      pt: "Obrigado pela sua consulta. Ficamos felizes em fornecer a oferta não vinculativa solicitada.",
      nl: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding."
    },
    vatEnabled: false,
    vatRate: 0,
    deliveryTerms: "7 days after receipt of invoice",
    deliveryTermsTranslations: {
      en: "7 days after receipt of invoice",
      de: "7 Tage nach Rechnungserhalt",
      fr: "7 jours après réception de la facture",
      es: "7 días después de recibir la factura",
      it: "7 giorni dopo la ricezione della fattura",
      pt: "7 dias após o recebimento da fatura",
      nl: "7 dagen na ontvangst van de factuur"
    },
    paymentTerms: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen. De factuur wordt pas opgemaakt nadat de service is verleend.",
    paymentTermsTranslations: {
      en: "By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.",
      de: "Mit Ihrer Bestellung erklären Sie sich damit einverstanden, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen. Die Rechnung wird erst nach Erbringung der Leistung erstellt.",
      fr: "En passant votre commande, vous acceptez de payer les services inclus dans cette offre dans les 7 jours suivant la réception de la facture. La facture ne sera émise qu'après la prestation du service.",
      es: "Al realizar su pedido, acepta pagar los servicios incluidos en esta oferta dentro de los 7 días posteriores a la recepción de la factura. La factura solo se emitirá después de que se haya prestado el servicio.",
      it: "Effettuando il tuo ordine, accetti di pagare i servizi inclusi in questa offerta entro 7 giorni dalla ricezione della fattura. La fattura verrà emessa solo dopo che il servizio sarà stato fornito.",
      pt: "Ao fazer seu pedido, você concorda em pagar pelos serviços incluídos nesta oferta dentro de 7 dias após o recebimento da fatura. A fatura só será emitida após a prestação do serviço.",
      nl: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen. De factuur wordt pas opgemaakt nadat de service is verleend."
    },
    footerContent: "",
    footerContentTranslations: {
      en: "", de: "", fr: "", es: "", it: "", pt: "", nl: ""
    },
    lineItems: [
      {
        name: "GOOGLE ZILVER PAKKET",
        nameTranslations: {
          en: "GOOGLE SILVER PACKAGE", de: "GOOGLE SILBER PAKET", fr: "FORFAIT GOOGLE ARGENT",
          es: "PAQUETE GOOGLE PLATA", it: "PACCHETTO GOOGLE ARGENTO", pt: "PACOTE GOOGLE PRATA", nl: "GOOGLE ZILVER PAKKET"
        },
        description: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen. U profiteert omdat u meer klanten bereikt en beter vindbaar bent. Gebruikers vertrouwen op beoordelingen zoals die van jou om te beslissen welke plaatsen ze willen bezoeken. LINK: https://g.co/kgs/ENA8mJJ",
        descriptionTranslations: {
          en: "Google Maps listing removal, i.e.: you get a new optimized Google My Business listing with new images that is better positioned, without negative reviews, that generates new customers online and stands out better from the competition + 5/5⭐⭐⭐⭐⭐5 reviews.",
          de: "Google Maps-Eintrag entfernen: Sie erhalten einen neuen optimierten Google My Business-Eintrag mit neuen Bildern, der besser positioniert ist, ohne negative Bewertungen + 5/5⭐⭐⭐⭐⭐5 Bewertungen.",
          fr: "Suppression de la liste Google Maps: vous obtenez une nouvelle liste Google My Business optimisée avec de nouvelles images qui est mieux positionnée + 5/5⭐⭐⭐⭐⭐5 avis.",
          es: "Eliminación de listado de Google Maps: obtienes un nuevo listado optimizado de Google Mi Negocio con nuevas imágenes que está mejor posicionado + 5/5⭐⭐⭐⭐⭐5 reseñas.",
          it: "Rimozione dell'elenco Google Maps: ottieni un nuovo elenco Google My Business ottimizzato con nuove immagini che è meglio posizionato + 5/5⭐⭐⭐⭐⭐5 recensioni.",
          pt: "Remoção da listagem do Google Maps: você obtém uma nova listagem otimizada do Google Meu Negócio com novas imagens que está melhor posicionada + 5/5⭐⭐⭐⭐⭐5 avaliações.",
          nl: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen."
        },
        quantity: 1, unitPrice: 250.00, unit: "piece",
        unitTranslations: { en: "piece", de: "Stück", fr: "pièce", es: "pieza", it: "pezzo", pt: "peça", nl: "stuk" },
        category: "Google Services"
      }
    ]
  },
  {
    id: "google-reviews-20",
    name: "POSITIVE GOOGLE REVIEWS (20 pieces)",
    nameTranslations: {
      en: "POSITIVE GOOGLE REVIEWS (20 pieces)", de: "POSITIVE GOOGLE BEWERTUNGEN (20 Stück)", 
      fr: "AVIS GOOGLE POSITIFS (20 pièces)", es: "RESEÑAS POSITIVAS DE GOOGLE (20 piezas)",
      it: "RECENSIONI GOOGLE POSITIVE (20 pezzi)", pt: "AVALIAÇÕES POSITIVAS DO GOOGLE (20 peças)", 
      nl: "POSITIEVE GOOGLE BEOORDELINGEN (20 stuks)"
    },
    proposalTitle: "Bescherm uw online REPUTATIE!",
    proposalTitleTranslations: {
      en: "Protect your online REPUTATION!", de: "Schützen Sie Ihren Online-RUF!", fr: "Protégez votre RÉPUTATION en ligne!",
      es: "¡Protege tu REPUTACIÓN en línea!", it: "Proteggi la tua REPUTAZIONE online!", pt: "Proteja sua REPUTAÇÃO online!", nl: "Bescherm uw online REPUTATIE!"
    },
    proposalDescription: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding.",
    proposalDescriptionTranslations: {
      en: "Thank you for your inquiry. We are happy to provide you with the requested non-binding offer.",
      de: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
      fr: "Merci pour votre demande. Nous sommes heureux de vous fournir l'offre non contraignante demandée.",
      es: "Gracias por su consulta. Estamos encantados de proporcionarle la oferta no vinculante solicitada.",
      it: "Grazie per la sua richiesta. Siamo felici di fornirle l'offerta non vincolante richiesta.",
      pt: "Obrigado pela sua consulta. Ficamos felizes em fornecer a oferta não vinculativa solicitada.",
      nl: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding."
    },
    vatEnabled: false, vatRate: 0,
    deliveryTerms: "7 days after receipt of invoice",
    deliveryTermsTranslations: {
      en: "7 days after receipt of invoice", de: "7 Tage nach Rechnungserhalt", fr: "7 jours après réception de la facture",
      es: "7 días después de recibir la factura", it: "7 giorni dopo la ricezione della fattura", pt: "7 dias após o recebimento da fatura", nl: "7 dagen na ontvangst van de factuur"
    },
    paymentTerms: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen. De factuur wordt pas opgemaakt nadat de service is verleend.",
    paymentTermsTranslations: {
      en: "By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.",
      de: "Mit Ihrer Bestellung erklären Sie sich damit einverstanden, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen.",
      fr: "En passant votre commande, vous acceptez de payer les services inclus dans cette offre dans les 7 jours suivant la réception de la facture.",
      es: "Al realizar su pedido, acepta pagar los servicios incluidos en esta oferta dentro de los 7 días posteriores a la recepción de la factura.",
      it: "Effettuando il tuo ordine, accetti di pagare i servizi inclusi in questa offerta entro 7 giorni dalla ricezione della fattura.",
      pt: "Ao fazer seu pedido, você concorda em pagar pelos serviços incluídos nesta oferta dentro de 7 dias após o recebimento da fatura.",
      nl: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen."
    },
    footerContent: "", footerContentTranslations: { en: "", de: "", fr: "", es: "", it: "", pt: "", nl: "" },
    lineItems: [
      {
        name: "POSITIEVE GOOGLE BEOORDELINGEN MET COMMENTAAR ⭐⭐⭐⭐⭐",
        nameTranslations: {
          en: "POSITIVE GOOGLE REVIEWS WITH COMMENTS ⭐⭐⭐⭐⭐", de: "POSITIVE GOOGLE BEWERTUNGEN MIT KOMMENTAREN ⭐⭐⭐⭐⭐",
          fr: "AVIS GOOGLE POSITIFS AVEC COMMENTAIRES ⭐⭐⭐⭐⭐", es: "RESEÑAS POSITIVAS DE GOOGLE CON COMENTARIOS ⭐⭐⭐⭐⭐",
          it: "RECENSIONI GOOGLE POSITIVE CON COMMENTI ⭐⭐⭐⭐⭐", pt: "AVALIAÇÕES POSITIVAS DO GOOGLE COM COMENTÁRIOS ⭐⭐⭐⭐⭐",
          nl: "POSITIEVE GOOGLE BEOORDELINGEN MET COMMENTAAR ⭐⭐⭐⭐⭐"
        },
        description: "Recensies zijn het beslissingskriterium voor consumenten voordat ze een aankoop doen. Consumenten gebruiken beoordelingen van eerdere klanten voordat ze een dienst gebruiken of een winkel binnengaan. 22% van alle consumenten koopt niet na de eerste negatieve recensie, elke negatieve recensie kost je tot wel 30 klanten. LINK: https://g.co/kgs/s3F1pz2",
        descriptionTranslations: {
          en: "Reviews are the decision criterion for consumers before making a purchase. Consumers use reviews from previous customers before they use a service or enter a shop. 22% of all consumers don't buy after the first negative review.",
          de: "Bewertungen sind das Entscheidungskriterium für Verbraucher vor einem Kauf. 22% aller Verbraucher kaufen nach der ersten negativen Bewertung nicht.",
          fr: "Les avis sont le critère de décision pour les consommateurs avant de faire un achat. 22% de tous les consommateurs n'achètent pas après le premier avis négatif.",
          es: "Las reseñas son el criterio de decisión para los consumidores antes de realizar una compra. El 22% de todos los consumidores no compra después de la primera reseña negativa.",
          it: "Le recensioni sono il criterio decisionale per i consumatori prima di effettuare un acquisto. Il 22% di tutti i consumatori non acquista dopo la prima recensione negativa.",
          pt: "As avaliações são o critério de decisão para os consumidores antes de fazer uma compra. 22% de todos os consumidores não compram após a primeira avaliação negativa.",
          nl: "Recensies zijn het beslissingskriterium voor consumenten voordat ze een aankoop doen. 22% van alle consumenten koopt niet na de eerste negatieve recensie."
        },
        quantity: 20, unitPrice: 10.00, unit: "piece",
        unitTranslations: { en: "piece", de: "Stück", fr: "pièce", es: "pieza", it: "pezzo", pt: "peça", nl: "stuk" },
        category: "Google Services"
      }
    ]
  },
  {
    id: "zilver-optimalisatiepakket",
    name: "ZILVER OPTIMALISATIEPAKKET (€299)",
    nameTranslations: {
      en: "SILVER OPTIMIZATION PACKAGE (€299)", de: "SILBER OPTIMIERUNGSPAKET (€299)", fr: "FORFAIT D'OPTIMISATION ARGENT (€299)",
      es: "PAQUETE DE OPTIMIZACIÓN PLATA (€299)", it: "PACCHETTO DI OTTIMIZZAZIONE ARGENTO (€299)", pt: "PACOTE DE OTIMIZAÇÃO PRATA (€299)", nl: "ZILVER OPTIMALISATIEPAKKET (€299)"
    },
    proposalTitle: "Bescherm uw online REPUTATIE!",
    proposalTitleTranslations: {
      en: "Protect your online REPUTATION!", de: "Schützen Sie Ihren Online-RUF!", fr: "Protégez votre RÉPUTATION en ligne!",
      es: "¡Protege tu REPUTACIÓN en línea!", it: "Proteggi la tua REPUTAZIONE online!", pt: "Proteja sua REPUTAÇÃO online!", nl: "Bescherm uw online REPUTATIE!"
    },
    proposalDescription: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding.",
    proposalDescriptionTranslations: {
      en: "Thank you for your inquiry. We are happy to provide you with the requested non-binding offer.",
      de: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
      fr: "Merci pour votre demande. Nous sommes heureux de vous fournir l'offre non contraignante demandée.",
      es: "Gracias por su consulta. Estamos encantados de proporcionarle la oferta no vinculante solicitada.",
      it: "Grazie per la sua richiesta. Siamo felici di fornirle l'offerta non vincolante richiesta.",
      pt: "Obrigado pela sua consulta. Ficamos felizes em fornecer a oferta não vinculativa solicitada.",
      nl: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding."
    },
    vatEnabled: false, vatRate: 0,
    deliveryTerms: "7 days after receipt of invoice",
    deliveryTermsTranslations: {
      en: "7 days after receipt of invoice", de: "7 Tage nach Rechnungserhalt", fr: "7 jours après réception de la facture",
      es: "7 días después de recibir la factura", it: "7 giorni dopo la ricezione della fattura", pt: "7 dias após o recebimento da fatura", nl: "7 dagen na ontvangst van de factuur"
    },
    paymentTerms: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen. De factuur wordt pas opgemaakt nadat de service is verleend.",
    paymentTermsTranslations: {
      en: "By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.",
      de: "Mit Ihrer Bestellung erklären Sie sich damit einverstanden, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen.",
      fr: "En passant votre commande, vous acceptez de payer les services inclus dans cette offre dans les 7 jours suivant la réception de la facture.",
      es: "Al realizar su pedido, acepta pagar los servicios incluidos en esta oferta dentro de los 7 días posteriores a la recepción de la factura.",
      it: "Effettuando il tuo ordine, accetti di pagare i servizi inclusi in questa offerta entro 7 giorni dalla ricezione della fattura.",
      pt: "Ao fazer seu pedido, você concorda em pagar pelos serviços incluídos nesta oferta dentro de 7 dias após o recebimento da fatura.",
      nl: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen."
    },
    footerContent: "", footerContentTranslations: { en: "", de: "", fr: "", es: "", it: "", pt: "", nl: "" },
    lineItems: [
      {
        name: "ZILVER OPTIMALISATIEPAKKET ⭐⭐⭐⭐⭐",
        nameTranslations: {
          en: "SILVER OPTIMIZATION PACKAGE ⭐⭐⭐⭐⭐", de: "SILBER OPTIMIERUNGSPAKET ⭐⭐⭐⭐⭐", fr: "FORFAIT D'OPTIMISATION ARGENT ⭐⭐⭐⭐⭐",
          es: "PAQUETE DE OPTIMIZACIÓN PLATA ⭐⭐⭐⭐⭐", it: "PACCHETTO DI OTTIMIZZAZIONE ARGENTO ⭐⭐⭐⭐⭐", pt: "PACOTE DE OTIMIZAÇÃO PRATA ⭐⭐⭐⭐⭐", nl: "ZILVER OPTIMALISATIEPAKKET ⭐⭐⭐⭐⭐"
        },
        description: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen. Wij optimaliseren en versterken uw aanwezigheid op Google Maps.",
        descriptionTranslations: {
          en: "Google Maps listing removal: you get a new optimized Google My Business listing with new images that is better positioned, without negative reviews + 5/5⭐⭐⭐⭐⭐5 reviews. We optimize and strengthen your presence on Google Maps.",
          de: "Google Maps-Eintrag entfernen: Sie erhalten einen neuen optimierten Google My Business-Eintrag mit neuen Bildern + 5/5⭐⭐⭐⭐⭐5 Bewertungen.",
          fr: "Suppression de la liste Google Maps: vous obtenez une nouvelle liste Google My Business optimisée + 5/5⭐⭐⭐⭐⭐5 avis.",
          es: "Eliminación de listado de Google Maps: obtienes un nuevo listado optimizado de Google Mi Negocio + 5/5⭐⭐⭐⭐⭐5 reseñas.",
          it: "Rimozione dell'elenco Google Maps: ottieni un nuovo elenco Google My Business ottimizzato + 5/5⭐⭐⭐⭐⭐5 recensioni.",
          pt: "Remoção da listagem do Google Maps: você obtém uma nova listagem otimizada do Google Meu Negócio + 5/5⭐⭐⭐⭐⭐5 avaliações.",
          nl: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is."
        },
        quantity: 1, unitPrice: 299.00, unit: "piece",
        unitTranslations: { en: "piece", de: "Stück", fr: "pièce", es: "pieza", it: "pezzo", pt: "peça", nl: "stuk" },
        category: "Google Services"
      }
    ]
  },
  {
    id: "google-paket-zilver",
    name: "GOOGLE PAKET ZILVER (€300)",
    nameTranslations: {
      en: "GOOGLE SILVER PACKAGE (€300)", de: "GOOGLE PAKET ZILVER (€300)", fr: "FORFAIT GOOGLE ARGENT (€300)",
      es: "PAQUETE GOOGLE PLATA (€300)", it: "PACCHETTO GOOGLE ARGENTO (€300)", pt: "PACOTE GOOGLE PRATA (€300)", nl: "GOOGLE PAKET ZILVER (€300)"
    },
    proposalTitle: "Bescherm uw online REPUTATIE!",
    proposalTitleTranslations: {
      en: "Protect your online REPUTATION!", de: "Schützen Sie Ihren Online-RUF!", fr: "Protégez votre RÉPUTATION en ligne!",
      es: "¡Protege tu REPUTACIÓN en línea!", it: "Proteggi la tua REPUTAZIONE online!", pt: "Proteja sua REPUTAÇÃO online!", nl: "Bescherm uw online REPUTATIE!"
    },
    proposalDescription: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding.",
    proposalDescriptionTranslations: {
      en: "Thank you for your inquiry. We are happy to provide you with the requested non-binding offer.",
      de: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
      fr: "Merci pour votre demande. Nous sommes heureux de vous fournir l'offre non contraignante demandée.",
      es: "Gracias por su consulta. Estamos encantados de proporcionarle la oferta no vinculante solicitada.",
      it: "Grazie per la sua richiesta. Siamo felici di fornirle l'offerta non vincolante richiesta.",
      pt: "Obrigado pela sua consulta. Ficamos felizes em fornecer a oferta não vinculativa solicitada.",
      nl: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding."
    },
    vatEnabled: false, vatRate: 0,
    deliveryTerms: "7 days after receipt of invoice",
    deliveryTermsTranslations: {
      en: "7 days after receipt of invoice", de: "7 Tage nach Rechnungserhalt", fr: "7 jours après réception de la facture",
      es: "7 días después de recibir la factura", it: "7 giorni dopo la ricezione della fattura", pt: "7 dias após o recebimento da fatura", nl: "7 dagen na ontvangst van de factuur"
    },
    paymentTerms: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen. De factuur wordt pas opgemaakt nadat de service is verleend.",
    paymentTermsTranslations: {
      en: "By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.",
      de: "Mit Ihrer Bestellung erklären Sie sich damit einverstanden, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen.",
      fr: "En passant votre commande, vous acceptez de payer les services inclus dans cette offre dans les 7 jours suivant la réception de la facture.",
      es: "Al realizar su pedido, acepta pagar los servicios incluidos en esta oferta dentro de los 7 días posteriores a la recepción de la factura.",
      it: "Effettuando il tuo ordine, accetti di pagare i servizi inclusi in questa offerta entro 7 giorni dalla ricezione della fattura.",
      pt: "Ao fazer seu pedido, você concorda em pagar pelos serviços incluídos nesta oferta dentro de 7 dias após o recebimento da fatura.",
      nl: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen."
    },
    footerContent: "", footerContentTranslations: { en: "", de: "", fr: "", es: "", it: "", pt: "", nl: "" },
    lineItems: [
      {
        name: "GOOGLE PAKET ZILVER",
        nameTranslations: {
          en: "GOOGLE SILVER PACKAGE", de: "GOOGLE PAKET ZILVER", fr: "FORFAIT GOOGLE ARGENT",
          es: "PAQUETE GOOGLE PLATA", it: "PACCHETTO GOOGLE ARGENTO", pt: "PACOTE GOOGLE PRATA", nl: "GOOGLE PAKET ZILVER"
        },
        description: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen.",
        descriptionTranslations: {
          en: "Google Maps listing removal: you get a new optimized Google My Business listing with new images that is better positioned, without negative reviews + 5/5⭐⭐⭐⭐⭐5 reviews.",
          de: "Google Maps-Eintrag entfernen: Sie erhalten einen neuen optimierten Google My Business-Eintrag mit neuen Bildern + 5/5⭐⭐⭐⭐⭐5 Bewertungen.",
          fr: "Suppression de la liste Google Maps: vous obtenez une nouvelle liste Google My Business optimisée + 5/5⭐⭐⭐⭐⭐5 avis.",
          es: "Eliminación de listado de Google Maps: obtienes un nuevo listado optimizado de Google Mi Negocio + 5/5⭐⭐⭐⭐⭐5 reseñas.",
          it: "Rimozione dell'elenco Google Maps: ottieni un nuovo elenco Google My Business ottimizzato + 5/5⭐⭐⭐⭐⭐5 recensioni.",
          pt: "Remoção da listagem do Google Maps: você obtém uma nova listagem otimizada do Google Meu Negócio + 5/5⭐⭐⭐⭐⭐5 avaliações.",
          nl: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is."
        },
        quantity: 1, unitPrice: 300.00, unit: "Stk",
        unitTranslations: { en: "piece", de: "Stk", fr: "pièce", es: "pieza", it: "pezzo", pt: "peça", nl: "stuk" },
        category: "Google Services"
      }
    ]
  },
  {
    id: "google-zilver-349",
    name: "GOOGLE ZILVER PAKKET (€349)",
    nameTranslations: {
      en: "GOOGLE SILVER PACKAGE (€349)", de: "GOOGLE SILBER PAKET (€349)", fr: "FORFAIT GOOGLE ARGENT (€349)",
      es: "PAQUETE GOOGLE PLATA (€349)", it: "PACCHETTO GOOGLE ARGENTO (€349)", pt: "PACOTE GOOGLE PRATA (€349)", nl: "GOOGLE ZILVER PAKKET (€349)"
    },
    proposalTitle: "Bescherm uw online REPUTATIE!",
    proposalTitleTranslations: {
      en: "Protect your online REPUTATION!", de: "Schützen Sie Ihren Online-RUF!", fr: "Protégez votre RÉPUTATION en ligne!",
      es: "¡Protege tu REPUTACIÓN en línea!", it: "Proteggi la tua REPUTAZIONE online!", pt: "Proteja sua REPUTAÇÃO online!", nl: "Bescherm uw online REPUTATIE!"
    },
    proposalDescription: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding.",
    proposalDescriptionTranslations: {
      en: "Thank you for your inquiry. We are happy to provide you with the requested non-binding offer.",
      de: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
      fr: "Merci pour votre demande. Nous sommes heureux de vous fournir l'offre non contraignante demandée.",
      es: "Gracias por su consulta. Estamos encantados de proporcionarle la oferta no vinculante solicitada.",
      it: "Grazie per la sua richiesta. Siamo felici di fornirle l'offerta non vincolante richiesta.",
      pt: "Obrigado pela sua consulta. Ficamos felizes em fornecer a oferta não vinculativa solicitada.",
      nl: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding."
    },
    vatEnabled: false, vatRate: 0,
    deliveryTerms: "7 days after receipt of invoice",
    deliveryTermsTranslations: {
      en: "7 days after receipt of invoice", de: "7 Tage nach Rechnungserhalt", fr: "7 jours après réception de la facture",
      es: "7 días después de recibir la factura", it: "7 giorni dopo la ricezione della fattura", pt: "7 dias após o recebimento da fatura", nl: "7 dagen na ontvangst van de factuur"
    },
    paymentTerms: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen. De factuur wordt pas opgemaakt nadat de service is verleend.",
    paymentTermsTranslations: {
      en: "By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice.",
      de: "Mit Ihrer Bestellung erklären Sie sich damit einverstanden, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen.",
      fr: "En passant votre commande, vous acceptez de payer les services inclus dans cette offre dans les 7 jours suivant la réception de la facture.",
      es: "Al realizar su pedido, acepta pagar los servicios incluidos en esta oferta dentro de los 7 días posteriores a la recepción de la factura.",
      it: "Effettuando il tuo ordine, accetti di pagare i servizi inclusi in questa offerta entro 7 giorni dalla ricezione della fattura.",
      pt: "Ao fazer seu pedido, você concorda em pagar pelos serviços incluídos nesta oferta dentro de 7 dias após o recebimento da fatura.",
      nl: "Door je bestelling te plaatsen, ga je ermee akkoord om de diensten die deel uitmaken van deze aanbieding binnen 7 dagen na ontvangst van de factuur te betalen."
    },
    footerContent: "", footerContentTranslations: { en: "", de: "", fr: "", es: "", it: "", pt: "", nl: "" },
    lineItems: [
      {
        name: "GOOGLE ZILVER PAKKET",
        nameTranslations: {
          en: "GOOGLE SILVER PACKAGE", de: "GOOGLE SILBER PAKET", fr: "FORFAIT GOOGLE ARGENT",
          es: "PAQUETE GOOGLE PLATA", it: "PACCHETTO GOOGLE ARGENTO", pt: "PACOTE GOOGLE PRATA", nl: "GOOGLE ZILVER PAKKET"
        },
        description: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen.",
        descriptionTranslations: {
          en: "Google Maps listing removal: you get a new optimized Google My Business listing with new images that is better positioned + 5/5⭐⭐⭐⭐⭐5 reviews.",
          de: "Google Maps-Eintrag entfernen: Sie erhalten einen neuen optimierten Google My Business-Eintrag + 5/5⭐⭐⭐⭐⭐5 Bewertungen.",
          fr: "Suppression de la liste Google Maps: vous obtenez une nouvelle liste Google My Business optimisée + 5/5⭐⭐⭐⭐⭐5 avis.",
          es: "Eliminación de listado de Google Maps: obtienes un nuevo listado optimizado de Google Mi Negocio + 5/5⭐⭐⭐⭐⭐5 reseñas.",
          it: "Rimozione dell'elenco Google Maps: ottieni un nuovo elenco Google My Business ottimizzato + 5/5⭐⭐⭐⭐⭐5 recensioni.",
          pt: "Remoção da listagem do Google Maps: você obtém uma nova listagem otimizada do Google Meu Negócio + 5/5⭐⭐⭐⭐⭐5 avaliações.",
          nl: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is."
        },
        quantity: 1, unitPrice: 349.00, unit: "piece",
        unitTranslations: { en: "piece", de: "Stück", fr: "pièce", es: "pieza", it: "pezzo", pt: "peça", nl: "stuk" },
        category: "Google Services"
      }
    ]
  },
  {
    id: "google-reviews-240",
    name: "POSITIVE GOOGLE REVIEWS (240 pieces)",
    nameTranslations: {
      en: "POSITIVE GOOGLE REVIEWS (240 pieces)", de: "POSITIVE GOOGLE BEWERTUNGEN (240 Stück)", 
      fr: "AVIS GOOGLE POSITIFS (240 pièces)", es: "RESEÑAS POSITIVAS DE GOOGLE (240 piezas)",
      it: "RECENSIONI GOOGLE POSITIVE (240 pezzi)", pt: "AVALIAÇÕES POSITIVAS DO GOOGLE (240 peças)", 
      nl: "POSITIEVE GOOGLE BEOORDELINGEN (240 stuks)"
    },
    proposalTitle: "Protect your online REPUTATION!",
    proposalTitleTranslations: {
      en: "Protect your online REPUTATION!", de: "Schützen Sie Ihren Online-RUF!", fr: "Protégez votre RÉPUTATION en ligne!",
      es: "¡Protege tu REPUTACIÓN en línea!", it: "Proteggi la tua REPUTAZIONE online!", pt: "Proteja sua REPUTAÇÃO online!", nl: "Bescherm uw online REPUTATIE!"
    },
    proposalDescription: "Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.",
    proposalDescriptionTranslations: {
      en: "Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.",
      de: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
      fr: "Merci pour votre demande. Nous sommes heureux de vous fournir l'offre non contraignante demandée.",
      es: "Gracias por su consulta. Estamos encantados de proporcionarle la oferta no vinculante solicitada.",
      it: "Grazie per la sua richiesta. Siamo felici di fornirle l'offerta non vincolante richiesta.",
      pt: "Obrigado pela sua consulta. Ficamos felizes em fornecer a oferta não vinculativa solicitada.",
      nl: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding."
    },
    vatEnabled: false, vatRate: 0,
    deliveryTerms: "7 days after receipt of invoice",
    deliveryTermsTranslations: {
      en: "7 days after receipt of invoice", de: "7 Tage nach Rechnungserhalt", fr: "7 jours après réception de la facture",
      es: "7 días después de recibir la factura", it: "7 giorni dopo la ricezione della fattura", pt: "7 dias após o recebimento da fatura", nl: "7 dagen na ontvangst van de factuur"
    },
    paymentTerms: "By placing your order, you undertake to pay for the services contained in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.",
    paymentTermsTranslations: {
      en: "By placing your order, you undertake to pay for the services contained in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.",
      de: "Mit Ihrer Bestellung verpflichten Sie sich, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen.",
      fr: "En passant votre commande, vous vous engagez à payer les services contenus dans cette offre dans les 7 jours suivant la réception de la facture.",
      es: "Al realizar su pedido, se compromete a pagar los servicios contenidos en esta oferta dentro de los 7 días posteriores a la recepción de la factura.",
      it: "Effettuando il tuo ordine, ti impegni a pagare i servizi contenuti in questa offerta entro 7 giorni dalla ricezione della fattura.",
      pt: "Ao fazer seu pedido, você se compromete a pagar pelos serviços contidos nesta oferta dentro de 7 dias após o recebimento da fatura.",
      nl: "Door je bestelling te plaatsen, verbind je je ertoe om de diensten in dit aanbod binnen 7 dagen na ontvangst van de factuur te betalen."
    },
    footerContent: "", footerContentTranslations: { en: "", de: "", fr: "", es: "", it: "", pt: "", nl: "" },
    lineItems: [
      {
        name: "POSITIVE GOOGLE REVIEWS WITH COMMENTS ⭐⭐⭐⭐⭐",
        nameTranslations: {
          en: "POSITIVE GOOGLE REVIEWS WITH COMMENTS ⭐⭐⭐⭐⭐", de: "POSITIVE GOOGLE BEWERTUNGEN MIT KOMMENTAREN ⭐⭐⭐⭐⭐",
          fr: "AVIS GOOGLE POSITIFS AVEC COMMENTAIRES ⭐⭐⭐⭐⭐", es: "RESEÑAS POSITIVAS DE GOOGLE CON COMENTARIOS ⭐⭐⭐⭐⭐",
          it: "RECENSIONI GOOGLE POSITIVE CON COMMENTI ⭐⭐⭐⭐⭐", pt: "AVALIAÇÕES POSITIVAS DO GOOGLE COM COMENTÁRIOS ⭐⭐⭐⭐⭐",
          nl: "POSITIEVE GOOGLE BEOORDELINGEN MET COMMENTAAR ⭐⭐⭐⭐⭐"
        },
        description: "Reviews are the decision criterion for consumers before making a purchase. Consumers use reviews from previous customers before they use a service or enter a shop. 22% of all consumers don't buy after the first negative review, each negative review costs you up to 30 customers.Benefit from positive Google reviews.",
        descriptionTranslations: {
          en: "Reviews are the decision criterion for consumers before making a purchase. Consumers use reviews from previous customers before they use a service or enter a shop.",
          de: "Bewertungen sind das Entscheidungskriterium für Verbraucher vor einem Kauf. Verbraucher nutzen Bewertungen früherer Kunden.",
          fr: "Les avis sont le critère de décision pour les consommateurs avant de faire un achat. Les consommateurs utilisent les avis de clients précédents.",
          es: "Las reseñas son el criterio de decisión para los consumidores antes de realizar una compra. Los consumidores usan reseñas de clientes anteriores.",
          it: "Le recensioni sono il criterio decisionale per i consumatori prima di effettuare un acquisto. I consumatori utilizzano le recensioni di clienti precedenti.",
          pt: "As avaliações são o critério de decisão para os consumidores antes de fazer uma compra. Os consumidores usam avaliações de clientes anteriores.",
          nl: "Recensies zijn het beslissingskriterium voor consumenten voordat ze een aankoop doen. Consumenten gebruiken beoordelingen van eerdere klanten."
        },
        quantity: 240, unitPrice: 10.00, unit: "piece",
        unitTranslations: { en: "piece", de: "Stück", fr: "pièce", es: "pieza", it: "pezzo", pt: "peça", nl: "stuk" },
        category: "Google Services"
      }
    ]
  },
  {
    id: "google-reviews-80",
    name: "POSITIVE GOOGLE REVIEWS (80 pieces)",
    nameTranslations: {
      en: "POSITIVE GOOGLE REVIEWS (80 pieces)", de: "POSITIVE GOOGLE BEWERTUNGEN (80 Stück)", 
      fr: "AVIS GOOGLE POSITIFS (80 pièces)", es: "RESEÑAS POSITIVAS DE GOOGLE (80 piezas)",
      it: "RECENSIONI GOOGLE POSITIVE (80 pezzi)", pt: "AVALIAÇÕES POSITIVAS DO GOOGLE (80 peças)", 
      nl: "POSITIEVE GOOGLE BEOORDELINGEN (80 stuks)"
    },
    proposalTitle: "Schützen Sie Ihre Online-REPUTATION!",
    proposalTitleTranslations: {
      en: "Protect your online REPUTATION!", de: "Schützen Sie Ihre Online-REPUTATION!", fr: "Protégez votre RÉPUTATION en ligne!",
      es: "¡Protege tu REPUTACIÓN en línea!", it: "Proteggi la tua REPUTAZIONE online!", pt: "Proteja sua REPUTAÇÃO online!", nl: "Bescherm uw online REPUTATIE!"
    },
    proposalDescription: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
    proposalDescriptionTranslations: {
      en: "Thank you for your inquiry. We are happy to provide you with the requested non-binding offer.",
      de: "Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen das gewünschte unverbindliche Angebot.",
      fr: "Merci pour votre demande. Nous sommes heureux de vous fournir l'offre non contraignante demandée.",
      es: "Gracias por su consulta. Estamos encantados de proporcionarle la oferta no vinculante solicitada.",
      it: "Grazie per la sua richiesta. Siamo felici di fornirle l'offerta non vincolante richiesta.",
      pt: "Obrigado pela sua consulta. Ficamos felizes em fornecer a oferta não vinculativa solicitada.",
      nl: "Hartelijk dank voor uw aanvraag. We doen u graag de gevraagde vrijblijvende aanbieding."
    },
    vatEnabled: false, vatRate: 0,
    deliveryTerms: "7 days after receipt of invoice",
    deliveryTermsTranslations: {
      en: "7 days after receipt of invoice", de: "7 Tage nach Rechnungserhalt", fr: "7 jours après réception de la facture",
      es: "7 días después de recibir la factura", it: "7 giorni dopo la ricezione della fattura", pt: "7 dias após o recebimento da fatura", nl: "7 dagen na ontvangst van de factuur"
    },
    paymentTerms: "Mit Ihrer Bestellung verpflichten Sie sich, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen. Die Rechnung wird erst nach Erbringung der Dienstleistung erstellt.",
    paymentTermsTranslations: {
      en: "By placing your order, you undertake to pay for the services contained in this offer within 7 days of receipt of the invoice.",
      de: "Mit Ihrer Bestellung verpflichten Sie sich, die in diesem Angebot enthaltenen Dienstleistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen.",
      fr: "En passant votre commande, vous vous engagez à payer les services contenus dans cette offre dans les 7 jours suivant la réception de la facture.",
      es: "Al realizar su pedido, se compromete a pagar los servicios contenidos en esta oferta dentro de los 7 días posteriores a la recepción de la factura.",
      it: "Effettuando il tuo ordine, ti impegni a pagare i servizi contenuti in questa offerta entro 7 giorni dalla ricezione della fattura.",
      pt: "Ao fazer seu pedido, você se compromete a pagar pelos serviços contidos nesta oferta dentro de 7 dias após o recebimento da fatura.",
      nl: "Door je bestelling te plaatsen, verbind je je ertoe om de diensten in dit aanbod binnen 7 dagen na ontvangst van de factuur te betalen."
    },
    footerContent: "", footerContentTranslations: { en: "", de: "", fr: "", es: "", it: "", pt: "", nl: "" },
    lineItems: [
      {
        name: "POSITIVE GOOGLE REVIEWS WITH COMMENTS ⭐⭐⭐⭐⭐",
        nameTranslations: {
          en: "POSITIVE GOOGLE REVIEWS WITH COMMENTS ⭐⭐⭐⭐⭐", de: "POSITIVE GOOGLE BEWERTUNGEN MIT KOMMENTAREN ⭐⭐⭐⭐⭐",
          fr: "AVIS GOOGLE POSITIFS AVEC COMMENTAIRES ⭐⭐⭐⭐⭐", es: "RESEÑAS POSITIVAS DE GOOGLE CON COMENTARIOS ⭐⭐⭐⭐⭐",
          it: "RECENSIONI GOOGLE POSITIVE CON COMMENTI ⭐⭐⭐⭐⭐", pt: "AVALIAÇÕES POSITIVAS DO GOOGLE COM COMENTÁRIOS ⭐⭐⭐⭐⭐",
          nl: "POSITIEVE GOOGLE BEOORDELINGEN MET COMMENTAAR ⭐⭐⭐⭐⭐"
        },
        description: "Reviews are the decision criterion for consumers before making a purchase. Consumers use reviews from previous customers before they use a service or enter a shop. 22% of all consumers don't buy after the first negative review, each negative review costs you up to 30 customers.Benefit from positive Google reviews.",
        descriptionTranslations: {
          en: "Reviews are the decision criterion for consumers before making a purchase. Consumers use reviews from previous customers before they use a service or enter a shop.",
          de: "Bewertungen sind das Entscheidungskriterium für Verbraucher vor einem Kauf. Verbraucher nutzen Bewertungen früherer Kunden.",
          fr: "Les avis sont le critère de décision pour les consommateurs avant de faire un achat. Les consommateurs utilisent les avis de clients précédents.",
          es: "Las reseñas son el criterio de decisión para los consumidores antes de realizar una compra. Los consumidores usan reseñas de clientes anteriores.",
          it: "Le recensioni sono il criterio decisionale per i consumatori prima di effettuare un acquisto. I consumatori utilizzano le recensioni di clienti precedenti.",
          pt: "As avaliações são o critério de decisão para os consumidores antes de fazer uma compra. Os consumidores usam avaliações de clientes anteriores.",
          nl: "Recensies zijn het beslissingskriterium voor consumenten voordat ze een aankoop doen. Consumenten gebruiken beoordelingen van eerdere klanten."
        },
        quantity: 80, unitPrice: 10.00, unit: "piece",
        unitTranslations: { en: "piece", de: "Stück", fr: "pièce", es: "pieza", it: "pezzo", pt: "peça", nl: "stuk" },
        category: "Google Services"
      }
    ]
  }
];