
// Available languages for proposal templates
export const PROPOSAL_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" }
];

// Translation strings for PDF templates
export const translations = {
  en: {
    proposal: "Proposal",
    date: "Date",
    customer: "Customer",
    customerRef: "Your customer no.",
    yourContact: "Your contact",
    content: "Content",
    productDescription: "PRODUCT/DESCRIPTION",
    price: "PRICE",
    qty: "QTY",
    total: "TOTAL",
    subtotal: "SUBTOTAL",
    vat: "VAT",
    totalAmount: "TOTAL",
    termsAndConditions: "TERMS AND CONDITIONS",
    paymentTerms: "By placing your order you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.",
    placeDate: "Place / date",
    signatureStamp: "Signature / Stamp",
    paymentData: "PAYMENT DATA:",
    accountNr: "ACCOUNT NR:",
    name: "NAME:",
    paymentMethod: "PAYMENT METHOD:"
  },
  de: {
    proposal: "Angebot",
    date: "Datum",
    customer: "Kunde",
    customerRef: "Ihre Kundennummer",
    yourContact: "Ihr Kontakt",
    content: "Inhalt",
    productDescription: "PRODUKT/BESCHREIBUNG",
    price: "PREIS",
    qty: "MENGE",
    total: "GESAMT",
    subtotal: "ZWISCHENSUMME",
    vat: "MwSt",
    totalAmount: "GESAMT",
    termsAndConditions: "GESCHÄFTSBEDINGUNGEN",
    paymentTerms: "Mit der Bestellung erklären Sie sich damit einverstanden, die in diesem Angebot enthaltenen Leistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen. Die Rechnung wird erst nach Erbringung der Leistung ausgestellt.",
    placeDate: "Ort / Datum",
    signatureStamp: "Unterschrift / Stempel",
    paymentData: "ZAHLUNGSDATEN:",
    accountNr: "KONTONR:",
    name: "NAME:",
    paymentMethod: "ZAHLUNGSMETHODE:"
  },
  es: {
    proposal: "Propuesta",
    date: "Fecha",
    customer: "Cliente",
    customerRef: "Su número de cliente",
    yourContact: "Su contacto",
    content: "Contenido",
    productDescription: "PRODUCTO/DESCRIPCIÓN",
    price: "PRECIO",
    qty: "CANT",
    total: "TOTAL",
    subtotal: "SUBTOTAL",
    vat: "IVA",
    totalAmount: "TOTAL",
    termsAndConditions: "TÉRMINOS Y CONDICIONES",
    paymentTerms: "Al realizar su pedido, acepta pagar los servicios incluidos en esta oferta en un plazo de 7 días a partir de la recepción de la factura. La factura solo se emitirá después de que se haya prestado el servicio.",
    placeDate: "Lugar / fecha",
    signatureStamp: "Firma / Sello",
    paymentData: "DATOS DE PAGO:",
    accountNr: "NÚM. CUENTA:",
    name: "NOMBRE:",
    paymentMethod: "MÉTODO DE PAGO:"
  }
};

export const PROPOSAL_STATUSES = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
  "Revised"
];
