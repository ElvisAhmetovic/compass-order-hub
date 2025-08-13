export interface PredefinedPackage {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  description: string;
  descriptionTranslations: Record<string, string>;
  quantity: number;
  unitPrice: number;
  unit: string;
  unitTranslations: Record<string, string>;
  category: string;
}

export const PREDEFINED_PACKAGES: PredefinedPackage[] = [
  {
    id: "google-zilver-pakket",
    name: "GOOGLE ZILVER PAKKET",
    nameTranslations: {
      en: "GOOGLE SILVER PACKAGE",
      de: "GOOGLE SILBER PAKET",
      fr: "FORFAIT GOOGLE ARGENT",
      es: "PAQUETE GOOGLE PLATA",
      it: "PACCHETTO GOOGLE ARGENTO",
      pt: "PACOTE GOOGLE PRATA",
      nl: "GOOGLE ZILVER PAKKET"
    },
    description: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen. U profiteert omdat u meer klanten bereikt en beter vindbaar bent. Gebruikers vertrouwen op beoordelingen zoals die van jou om te beslissen welke plaatsen ze willen bezoeken. LINK: https://g.co/kgs/ENA8mJJ",
    descriptionTranslations: {
      en: "Google Maps listing removal, i.e.: you get a new optimized Google My Business listing with new images that is better positioned, without negative reviews, that generates new customers online and stands out better from the competition + 5/5⭐⭐⭐⭐⭐5 reviews. You benefit because you reach more customers and are more findable. Users trust reviews like yours to decide which places they want to visit.",
      de: "Google Maps-Eintrag entfernen, d.h.: Sie erhalten einen neuen optimierten Google My Business-Eintrag mit neuen Bildern, der besser positioniert ist, ohne negative Bewertungen, der online neue Kunden generiert und sich besser von der Konkurrenz abhebt + 5/5⭐⭐⭐⭐⭐5 Bewertungen. Sie profitieren, weil Sie mehr Kunden erreichen und besser auffindbar sind.",
      fr: "Suppression de la liste Google Maps, c'est-à-dire : vous obtenez une nouvelle liste Google My Business optimisée avec de nouvelles images qui est mieux positionnée, sans avis négatifs, qui génère de nouveaux clients en ligne et se démarque mieux de la concurrence + 5/5⭐⭐⭐⭐⭐5 avis.",
      es: "Eliminación de listado de Google Maps, es decir: obtienes un nuevo listado optimizado de Google Mi Negocio con nuevas imágenes que está mejor posicionado, sin reseñas negativas, que genera nuevos clientes en línea y se destaca mejor de la competencia + 5/5⭐⭐⭐⭐⭐5 reseñas.",
      it: "Rimozione dell'elenco Google Maps, cioè: ottieni un nuovo elenco Google My Business ottimizzato con nuove immagini che è meglio posizionato, senza recensioni negative, che genera nuovi clienti online e si distingue meglio dalla concorrenza + 5/5⭐⭐⭐⭐⭐5 recensioni.",
      pt: "Remoção da listagem do Google Maps, ou seja: você obtém uma nova listagem otimizada do Google Meu Negócio com novas imagens que está melhor posicionada, sem avaliações negativas, que gera novos clientes online e se destaca melhor da concorrência + 5/5⭐⭐⭐⭐⭐5 avaliações.",
      nl: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen."
    },
    quantity: 1,
    unitPrice: 250.00,
    unit: "piece",
    unitTranslations: {
      en: "piece",
      de: "Stück",
      fr: "pièce",
      es: "pieza",
      it: "pezzo",
      pt: "peça",
      nl: "stuk"
    },
    category: "Google Services"
  },
  {
    id: "positive-google-reviews",
    name: "POSITIEVE GOOGLE BEOORDELINGEN MET COMMENTAAR",
    nameTranslations: {
      en: "POSITIVE GOOGLE REVIEWS WITH COMMENTS",
      de: "POSITIVE GOOGLE BEWERTUNGEN MIT KOMMENTAREN",
      fr: "AVIS GOOGLE POSITIFS AVEC COMMENTAIRES",
      es: "RESEÑAS POSITIVAS DE GOOGLE CON COMENTARIOS",
      it: "RECENSIONI GOOGLE POSITIVE CON COMMENTI",
      pt: "AVALIAÇÕES POSITIVAS DO GOOGLE COM COMENTÁRIOS",
      nl: "POSITIEVE GOOGLE BEOORDELINGEN MET COMMENTAAR"
    },
    description: "Reviews zijn het beslissingskriterium voor consumenten voordat ze een aankoop doen. Consumenten gebruiken beoordelingen van eerdere klanten voordat ze een dienst gebruiken of een winkel binnengaan. 22% van alle consumenten koopt niet na de eerste negatieve recensie, elke negatieve recensie kost je tot wel 30 klanten.Profiteer van positieve Google recensies. Ontvang 5 0 sterrenbeoordelingen met opmerkingen die uw bedrijf positief identificeren, zodat u zich kunt onderscheiden van de concurrentie en meer klanten naar uw bedrijf kunt trekken. LINK: https://g.co/kgs/s3F1pz2",
    descriptionTranslations: {
      en: "Reviews are the decision criterion for consumers before making a purchase. Consumers use reviews from previous customers before they use a service or enter a shop. 22% of all consumers don't buy after the first negative review, each negative review costs you up to 30 customers. Benefit from positive Google reviews. Get 50 star reviews with comments that positively identify your business, helping you stand out from the competition and attract more customers to your business.",
      de: "Bewertungen sind das Entscheidungskriterium für Verbraucher vor einem Kauf. Verbraucher nutzen Bewertungen früherer Kunden, bevor sie einen Service nutzen oder ein Geschäft betreten. 22% aller Verbraucher kaufen nach der ersten negativen Bewertung nicht, jede negative Bewertung kostet Sie bis zu 30 Kunden. Profitieren Sie von positiven Google-Bewertungen.",
      fr: "Les avis sont le critère de décision pour les consommateurs avant de faire un achat. Les consommateurs utilisent les avis de clients précédents avant d'utiliser un service ou d'entrer dans un magasin. 22% de tous les consommateurs n'achètent pas après le premier avis négatif, chaque avis négatif vous coûte jusqu'à 30 clients.",
      es: "Las reseñas son el criterio de decisión para los consumidores antes de realizar una compra. Los consumidores usan reseñas de clientes anteriores antes de usar un servicio o entrar a una tienda. El 22% de todos los consumidores no compra después de la primera reseña negativa, cada reseña negativa te cuesta hasta 30 clientes.",
      it: "Le recensioni sono il criterio decisionale per i consumatori prima di effettuare un acquisto. I consumatori utilizzano le recensioni di clienti precedenti prima di utilizzare un servizio o entrare in un negozio. Il 22% di tutti i consumatori non acquista dopo la prima recensione negativa, ogni recensione negativa ti costa fino a 30 clienti.",
      pt: "As avaliações são o critério de decisão para os consumidores antes de fazer uma compra. Os consumidores usam avaliações de clientes anteriores antes de usar um serviço ou entrar em uma loja. 22% de todos os consumidores não compram após a primeira avaliação negativa, cada avaliação negativa custa até 30 clientes.",
      nl: "Reviews zijn het beslissingskriterium voor consumenten voordat ze een aankoop doen. Consumenten gebruiken beoordelingen van eerdere klanten voordat ze een dienst gebruiken of een winkel binnengaan. 22% van alle consumenten koopt niet na de eerste negatieve recensie, elke negatieve recensie kost je tot wel 30 klanten."
    },
    quantity: 20,
    unitPrice: 10.00,
    unit: "piece",
    unitTranslations: {
      en: "piece",
      de: "Stück",
      fr: "pièce",
      es: "pieza",
      it: "pezzo",
      pt: "peça",
      nl: "stuk"
    },
    category: "Google Services"
  },
  {
    id: "zilver-optimalisatiepakket",
    name: "ZILVER OPTIMALISATIEPAKKET",
    nameTranslations: {
      en: "SILVER OPTIMIZATION PACKAGE",
      de: "SILBER OPTIMIERUNGSPAKET",
      fr: "FORFAIT D'OPTIMISATION ARGENT",
      es: "PAQUETE DE OPTIMIZACIÓN PLATA",
      it: "PACCHETTO DI OTTIMIZZAZIONE ARGENTO",
      pt: "PACOTE DE OTIMIZAÇÃO PRATA",
      nl: "ZILVER OPTIMALISATIEPAKKET"
    },
    description: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen. Wij optimaliseren en versterken uw aanwezigheid op Google Maps met uw Google Mijn Bedrijf vermelding. U profiteert omdat u meer klanten bereikt en beter vindbaar bent. Gebruikers vertrouwen op beoordelingen zoals die van jou om te beslissen welke plaatsen ze willen bezoeken.",
    descriptionTranslations: {
      en: "Google Maps listing removal, i.e.: you get a new optimized Google My Business listing with new images that is better positioned, without negative reviews, that generates new customers online and stands out better from the competition + 5/5⭐⭐⭐⭐⭐5 reviews. We optimize and strengthen your presence on Google Maps with your Google My Business listing.",
      de: "Google Maps-Eintrag entfernen, d.h.: Sie erhalten einen neuen optimierten Google My Business-Eintrag mit neuen Bildern, der besser positioniert ist, ohne negative Bewertungen, der online neue Kunden generiert und sich besser von der Konkurrenz abhebt + 5/5⭐⭐⭐⭐⭐5 Bewertungen.",
      fr: "Suppression de la liste Google Maps, c'est-à-dire : vous obtenez une nouvelle liste Google My Business optimisée avec de nouvelles images qui est mieux positionnée, sans avis négatifs, qui génère de nouveaux clients en ligne et se démarque mieux de la concurrence + 5/5⭐⭐⭐⭐⭐5 avis.",
      es: "Eliminación de listado de Google Maps, es decir: obtienes un nuevo listado optimizado de Google Mi Negocio con nuevas imágenes que está mejor posicionado, sin reseñas negativas, que genera nuevos clientes en línea y se destaca mejor de la competencia + 5/5⭐⭐⭐⭐⭐5 reseñas.",
      it: "Rimozione dell'elenco Google Maps, cioè: ottieni un nuovo elenco Google My Business ottimizzato con nuove immagini che è meglio posizionato, senza recensioni negative, che genera nuovi clienti online e si distingue meglio dalla concorrenza + 5/5⭐⭐⭐⭐⭐5 recensioni.",
      pt: "Remoção da listagem do Google Maps, ou seja: você obtém uma nova listagem otimizada do Google Meu Negócio com novas imagens que está melhor posicionada, sem avaliações negativas, que gera novos clientes online e se destaca melhor da concorrência + 5/5⭐⭐⭐⭐⭐5 avaliações.",
      nl: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen."
    },
    quantity: 1,
    unitPrice: 299.00,
    unit: "piece",
    unitTranslations: {
      en: "piece",
      de: "Stück",
      fr: "pièce",
      es: "pieza",
      it: "pezzo",
      pt: "peça",
      nl: "stuk"
    },
    category: "Google Services"
  },
  {
    id: "google-paket-zilver",
    name: "GOOGLE PAKET ZILVER",
    nameTranslations: {
      en: "GOOGLE SILVER PACKAGE",
      de: "GOOGLE SILBER PAKET",
      fr: "FORFAIT GOOGLE ARGENT",
      es: "PAQUETE GOOGLE PLATA",
      it: "PACCHETTO GOOGLE ARGENTO",
      pt: "PACOTE GOOGLE PRATA",
      nl: "GOOGLE PAKET ZILVER"
    },
    description: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen. U profiteert omdat u meer klanten bereikt en beter vindbaar bent. Gebruikers vertrouwen op beoordelingen zoals die van jou om te beslissen welke plaatsen ze willen bezoeken.",
    descriptionTranslations: {
      en: "Google Maps listing removal, i.e.: you get a new optimized Google My Business listing with new images that is better positioned, without negative reviews, that generates new customers online and stands out better from the competition + 5/5⭐⭐⭐⭐⭐5 reviews. You benefit because you reach more customers and are more findable.",
      de: "Google Maps-Eintrag entfernen, d.h.: Sie erhalten einen neuen optimierten Google My Business-Eintrag mit neuen Bildern, der besser positioniert ist, ohne negative Bewertungen, der online neue Kunden generiert und sich besser von der Konkurrenz abhebt + 5/5⭐⭐⭐⭐⭐5 Bewertungen.",
      fr: "Suppression de la liste Google Maps, c'est-à-dire : vous obtenez une nouvelle liste Google My Business optimisée avec de nouvelles images qui est mieux positionnée, sans avis négatifs, qui génère de nouveaux clients en ligne et se démarque mieux de la concurrence + 5/5⭐⭐⭐⭐⭐5 avis.",
      es: "Eliminación de listado de Google Maps, es decir: obtienes un nuevo listado optimizado de Google Mi Negocio con nuevas imágenes que está mejor posicionado, sin reseñas negativas, que genera nuevos clientes en línea y se destaca mejor de la competencia + 5/5⭐⭐⭐⭐⭐5 reseñas.",
      it: "Rimozione dell'elenco Google Maps, cioè: ottieni un nuovo elenco Google My Business ottimizzato con nuove immagini che è meglio posizionato, senza recensioni negative, che genera nuovi clienti online e si distingue meglio dalla concorrenza + 5/5⭐⭐⭐⭐⭐5 recensioni.",
      pt: "Remoção da listagem do Google Maps, ou seja: você obtém uma nova listagem otimizada do Google Meu Negócio com novas imagens que está melhor posicionada, sem avaliações negativas, que gera novos clientes online e se destaca melhor da concorrência + 5/5⭐⭐⭐⭐⭐5 avaliações.",
      nl: "Google Maps vermelding verwijderen, d.w.z: je krijgt een nieuwe geoptimaliseerde Google Mijn Bedrijf vermelding met nieuwe afbeeldingen die beter gepositioneerd is, zonder negatieve beoordelingen, die online nieuwe klanten genereert en zich beter onderscheidt van de concurrentie + 5/5⭐⭐⭐⭐⭐5 beoordelingen."
    },
    quantity: 1,
    unitPrice: 300.00,
    unit: "piece",
    unitTranslations: {
      en: "piece",
      de: "Stück",
      fr: "pièce",
      es: "pieza",
      it: "pezzo",
      pt: "peça",
      nl: "stuk"
    },
    category: "Google Services"
  }
];