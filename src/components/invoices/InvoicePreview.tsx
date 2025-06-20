
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currencyUtils";
import { Invoice, InvoiceLineItem, Client } from "@/types/invoice";

interface InvoicePreviewProps {
  invoice?: Invoice;
  lineItems: InvoiceLineItem[];
  client?: Client;
  templateSettings: any;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  lineItems,
  client,
  templateSettings
}) => {
  // Get the currency from template settings, falling back to EUR
  const currentCurrency = templateSettings.currency || 'EUR';
  console.log('InvoicePreview: Using currency:', currentCurrency);
  
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price * (1 - item.discount_rate));
    }, 0);
    
    const vatAmount = templateSettings.vatEnabled 
      ? lineItems.reduce((sum, item) => {
          const netItemAmount = item.quantity * item.unit_price * (1 - item.discount_rate);
          return sum + (netItemAmount * item.vat_rate);
        }, 0)
      : 0;
    
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total };
  };

  const { subtotal, vatAmount, total } = calculateTotals();
  
  // Get translated account names and payment info
  const getAccountTranslations = (language: string, accountId: string) => {
    const translations = {
      en: {
        belgium: "Belgium Bank Account",
        germany: "German Bank Account"
      },
      nl: {
        belgium: "Bankrekening België",
        germany: "Duitse Bankrekening"
      },
      de: {
        belgium: "Belgisches Bankkonto",
        germany: "Deutsches Bankkonto"
      },
      fr: {
        belgium: "Compte bancaire belge",
        germany: "Compte bancaire allemand"
      },
      es: {
        belgium: "Cuenta bancaria belga",
        germany: "Cuenta bancaria alemana"
      },
      da: {
        belgium: "Belgisk bankkonto",
        germany: "Tysk bankkonto"
      },
      no: {
        belgium: "Belgisk bankkonto",
        germany: "Tysk bankkonto"
      },
      cs: {
        belgium: "Belgický bankovní účet",
        germany: "Německý bankovní účet"
      },
      pl: {
        belgium: "Belgijskie konto bankowe",
        germany: "Niemieckie konto bankowe"
      },
      sv: {
        belgium: "Belgiskt bankkonto",
        germany: "Tyskt bankkonto"
      }
    };
    
    const lang = language || 'en';
    return translations[lang]?.[accountId] || translations.en[accountId];
  };

  const selectedAccount = templateSettings.selectedPaymentAccount === "belgium" 
    ? {
        id: "belgium",
        name: getAccountTranslations(templateSettings.language, "belgium"),
        iban: "BE79967023897833",
        bic: "TRWIBEB1XXX",
        blz: "967",
        account: "967023897833"
      }
    : {
        id: "germany",
        name: getAccountTranslations(templateSettings.language, "germany"),
        iban: "DE91240703680071572200",
        bic: "DEUTDE2HP22",
        bank: "Postbank/DSL Ndl of Deutsche Bank"
      };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Translation function for line item descriptions
  const translateLineItemDescription = (description: string, language: string) => {
    const lineItemTranslations = {
      // Common service/product descriptions
      'Sample Service': {
        en: 'Sample Service',
        nl: 'Voorbeelddienst',
        de: 'Beispielservice',
        fr: 'Service d\'exemple',
        es: 'Servicio de muestra',
        da: 'Eksempeltjeneste',
        no: 'Eksempeltjeneste',
        cs: 'Ukázková služba',
        pl: 'Przykładowa usługa',
        sv: 'Exempeltjänst'
      },
      'Consulting': {
        en: 'Consulting',
        nl: 'Consultancy',
        de: 'Beratung',
        fr: 'Consultation',
        es: 'Consultoría',
        da: 'Rådgivning',
        no: 'Rådgivning',
        cs: 'Poradenství',
        pl: 'Doradztwo',
        sv: 'Rådgivning'
      },
      'Design Work': {
        en: 'Design Work',
        nl: 'Ontwerpwerk',
        de: 'Designarbeit',
        fr: 'Travail de conception',
        es: 'Trabajo de diseño',
        da: 'Designarbejde',
        no: 'Designarbeid',
        cs: 'Designová práce',
        pl: 'Praca projektowa',
        sv: 'Designarbete'
      },
      'Development': {
        en: 'Development',
        nl: 'Ontwikkeling',
        de: 'Entwicklung',
        fr: 'Développement',
        es: 'Desarrollo',
        da: 'Udvikling',
        no: 'Utvikling',
        cs: 'Vývoj',
        pl: 'Rozwój',
        sv: 'Utveckling'
      },
      'Web Development': {
        en: 'Web Development',
        nl: 'Webontwikkeling',
        de: 'Webentwicklung',
        fr: 'Développement web',
        es: 'Desarrollo web',
        da: 'Webudvikling',
        no: 'Webutvikling',
        cs: 'Vývoj webu',
        pl: 'Rozwój stron internetowych',
        sv: 'Webbutveckling'
      },
      'Marketing': {
        en: 'Marketing',
        nl: 'Marketing',
        de: 'Marketing',
        fr: 'Marketing',
        es: 'Marketing',
        da: 'Marketing',
        no: 'Markedsføring',
        cs: 'Marketing',
        pl: 'Marketing',
        sv: 'Marknadsföring'
      },
      'Training': {
        en: 'Training',
        nl: 'Training',
        de: 'Schulung',
        fr: 'Formation',
        es: 'Formación',
        da: 'Træning',
        no: 'Trening',
        cs: 'Školení',
        pl: 'Szkolenie',
        sv: 'Utbildning'
      },
      'Support': {
        en: 'Support',
        nl: 'Ondersteuning',
        de: 'Support',
        fr: 'Assistance',
        es: 'Soporte',
        da: 'Support',
        no: 'Støtte',
        cs: 'Podpora',
        pl: 'Wsparcie',
        sv: 'Support'
      },
      'Maintenance': {
        en: 'Maintenance',
        nl: 'Onderhoud',
        de: 'Wartung',
        fr: 'Maintenance',
        es: 'Mantenimiento',
        da: 'Vedligeholdelse',
        no: 'Vedlikehold',
        cs: 'Údržba',
        pl: 'Konserwacja',
        sv: 'Underhåll'
      },
      'License': {
        en: 'License',
        nl: 'Licentie',
        de: 'Lizenz',
        fr: 'Licence',
        es: 'Licencia',
        da: 'Licens',
        no: 'Lisens',
        cs: 'Licence',
        pl: 'Licencja',
        sv: 'Licens'
      }
    };

    const lang = language || 'en';
    
    // Check if we have a direct translation for this description
    if (lineItemTranslations[description]) {
      return lineItemTranslations[description][lang] || description;
    }
    
    // If no direct translation found, return the original description
    return description;
  };

  const getTranslatedText = (key: string) => {
    const translations = {
      en: {
        date: "Date:",
        dueDate: "Due Date:",
        balanceDue: "Balance Due:",
        billTo: "Bill To:",
        item: "Item",
        quantity: "Quantity",
        rate: "Rate",
        amount: "Amount",
        subtotal: "Subtotal:",
        tax: "Tax",
        total: "Total:",
        notes: "Notes:",
        terms: "Terms:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Account",
        bank: "Bank",
        contactPerson: "Contact Person:",
        companyRegistrationNumber: "Company Registration Number:",
        uidNumber: "UID- Number:"
      },
      nl: {
        date: "Datum:",
        dueDate: "Vervaldatum:",
        balanceDue: "Saldo:",
        billTo: "Factuur aan:",
        item: "Item",
        quantity: "Aantal",
        rate: "Tarief",
        amount: "Bedrag",
        subtotal: "Subtotaal:",
        tax: "BTW",
        total: "Totaal:",
        notes: "Opmerkingen:",
        terms: "Voorwaarden:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Rekening",
        bank: "Bank",
        contactPerson: "Contactpersoon:",
        companyRegistrationNumber: "Bedrijfsregistratienummer:",
        uidNumber: "UID-nummer:"
      },
      de: {
        date: "Datum:",
        dueDate: "Fälligkeitsdatum:",
        balanceDue: "Saldo:",
        billTo: "Rechnung an:",
        item: "Artikel",
        quantity: "Menge",
        rate: "Preis",
        amount: "Betrag",
        subtotal: "Zwischensumme:",
        tax: "MwSt",
        total: "Gesamt:",
        notes: "Notizen:",
        terms: "Bedingungen:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank",
        contactPerson: "Ansprechpartner:",
        companyRegistrationNumber: "Firmenregistrierungsnummer:",
        uidNumber: "UID-Nummer:"
      },
      fr: {
        date: "Date:",
        dueDate: "Date d'échéance:",
        balanceDue: "Solde dû:",
        billTo: "Facturer à:",
        item: "Article",
        quantity: "Quantité",
        rate: "Taux",
        amount: "Montant",
        subtotal: "Sous-total:",
        tax: "TVA",
        total: "Total:",
        notes: "Notes:",
        terms: "Conditions:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Compte",
        bank: "Banque",
        contactPerson: "Personne de contact:",
        companyRegistrationNumber: "Numéro d'enregistrement de l'entreprise:",
        uidNumber: "Numéro UID:"
      },
      es: {
        date: "Fecha:",
        dueDate: "Fecha de vencimiento:",
        balanceDue: "Saldo pendiente:",
        billTo: "Facturar a:",
        item: "Artículo",
        quantity: "Cantidad",
        rate: "Precio",
        amount: "Importe",
        subtotal: "Subtotal:",
        tax: "IVA",
        total: "Total:",
        notes: "Notas:",
        terms: "Términos:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Cuenta",
        bank: "Banco",
        contactPerson: "Persona de contacto:",
        companyRegistrationNumber: "Número de registro de la empresa:",
        uidNumber: "Número UID:"
      },
      da: {
        date: "Dato:",
        dueDate: "Forfaldsdato:",
        balanceDue: "Resterende saldo:",
        billTo: "Faktureres til:",
        item: "Vare",
        quantity: "Antal",
        rate: "Pris",
        amount: "Beløb",
        subtotal: "Subtotal:",
        tax: "Moms",
        total: "Total:",
        notes: "Noter:",
        terms: "Vilkår:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank",
        contactPerson: "Kontaktperson:",
        companyRegistrationNumber: "Virksomhedsregistreringsnummer:",
        uidNumber: "UID-nummer:"
      },
      no: {
        date: "Dato:",
        dueDate: "Forfallsdato:",
        balanceDue: "Gjenstående saldo:",
        billTo: "Faktureres til:",
        item: "Vare",
        quantity: "Antall",
        rate: "Pris",
        amount: "Beløp",
        subtotal: "Subtotal:",
        tax: "MVA",
        total: "Total:",
        notes: "Notater:",
        terms: "Vilkår:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank",
        contactPerson: "Kontaktperson:",
        companyRegistrationNumber: "Selskapsregistreringsnummer:",
        uidNumber: "UID-nummer:"
      },
      cs: {
        date: "Datum:",
        dueDate: "Datum splatnosti:",
        balanceDue: "Zbývající zůstatek:",
        billTo: "Fakturovat na:",
        item: "Položka",
        quantity: "Množství",
        rate: "Cena",
        amount: "Částka",
        subtotal: "Mezisoučet:",
        tax: "DPH",
        total: "Celkem:",
        notes: "Poznámky:",
        terms: "Podmínky:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Účet",
        bank: "Banka",
        contactPerson: "Kontaktní osoba:",
        companyRegistrationNumber: "Registrační číslo společnosti:",
        uidNumber: "UID číslo:"
      },
      pl: {
        date: "Data:",
        dueDate: "Termin płatności:",
        balanceDue: "Pozostałe saldo:",
        billTo: "Fakturować do:",
        item: "Pozycja",
        quantity: "Ilość",
        rate: "Cena",
        amount: "Kwota",
        subtotal: "Suma częściowa:",
        tax: "VAT",
        total: "Razem:",
        notes: "Uwagi:",
        terms: "Warunki:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank",
        contactPerson: "Osoba kontaktowa:",
        companyRegistrationNumber: "Numer rejestracji firmy:",
        uidNumber: "Numer UID:"
      },
      sv: {
        date: "Datum:",
        dueDate: "Förfallodatum:",
        balanceDue: "Återstående saldo:",
        billTo: "Fakturera till:",
        item: "Artikel",
        quantity: "Antal",
        rate: "Pris",
        amount: "Belopp",
        subtotal: "Delsumma:",
        tax: "Moms",
        total: "Totalt:",
        notes: "Anteckningar:",
        terms: "Villkor:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank",
        contactPerson: "Kontaktperson:",
        companyRegistrationNumber: "Företagsregistreringsnummer:",
        uidNumber: "UID-nummer:"
      }
    };
    
    const lang = templateSettings.language || 'en';
    return translations[lang]?.[key] || translations.en[key];
  };

  // Provide default company info if not available
  const companyInfo = templateSettings.companyInfo || {
    name: "Company Name",
    contactPerson: "Contact Person",
    registrationNumber: "123456789",
    vatId: "VAT123456789",
    street: "Street Address",
    postal: "12345",
    city: "City",
    email: "info@company.com"
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-8">
        <div className="bg-white min-h-[800px] space-y-6" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6">
            <div className="flex items-center gap-6">
              {templateSettings.logo && (
                <img 
                  src={templateSettings.logo} 
                  alt="Company Logo" 
                  className={`${
                    templateSettings.logoSize === "small" ? "h-16" :
                    templateSettings.logoSize === "medium" ? "h-20" :
                    "h-32"
                  } w-auto object-contain`}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {companyInfo.name}
                </h1>
                <div className="text-xs text-gray-500 leading-relaxed">
                  <div>{companyInfo.street}</div>
                  <div>{companyInfo.postal} {companyInfo.city}</div>
                  <div>{companyInfo.email}</div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-4xl font-bold text-gray-700 mb-2">
                {templateSettings.invoiceNumberPrefix || "RE NR:"}{invoice?.invoice_number || "784/25"}
              </h2>
              <p className="text-sm text-gray-500">
                # {templateSettings.invoiceNumberPrefix || "RE NR:"}{invoice?.invoice_number || "784/25"}
              </p>
            </div>
          </div>

          {/* Company Details and Invoice Info */}
          <div className="grid grid-cols-2 gap-10">
            <div>
              <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
                <div className="font-bold mb-2">{companyInfo.name}</div>
                {companyInfo.contactPerson && (
                  <div>{getTranslatedText('contactPerson')} {companyInfo.contactPerson}</div>
                )}
                <div>{getTranslatedText('companyRegistrationNumber')} {companyInfo.registrationNumber}</div>
                <div>{getTranslatedText('uidNumber')} {companyInfo.vatId}</div>
                <div>{companyInfo.street} {companyInfo.postal} {companyInfo.city}</div>
                <div>{companyInfo.email}</div>
              </div>
            </div>
            
            <div className="text-right space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold">{getTranslatedText('date')}</span>
                <span>{invoice?.issue_date ? formatDate(invoice.issue_date) : formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{getTranslatedText('dueDate')}</span>
                <span>{invoice?.due_date ? formatDate(invoice.due_date) : formatDate(new Date(Date.now() + 4*24*60*60*1000).toISOString())}</span>
              </div>
              <div className="flex justify-between font-bold text-xl border-t pt-3">
                <span>{getTranslatedText('balanceDue')}</span>
                <span>{formatCurrency(total, currentCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <div className="font-bold text-gray-700 mb-3 text-lg">{getTranslatedText('billTo')}</div>
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
              {client ? (
                <>
                  <div className="font-bold mb-1">{client.name}</div>
                  <div>{client.email}</div>
                  {client.address && <div>{client.address}</div>}
                  {client.city && <div>{client.zip_code} {client.city}</div>}
                  {client.country && <div>{client.country}</div>}
                </>
              ) : (
                <>
                  <div className="font-bold">Client Name</div>
                  <div>client@email.com</div>
                  <div>Client Address</div>
                  <div>City, Country</div>
                </>
              )}
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="mt-8">
            <table className="w-full shadow-sm">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="text-left py-4 px-4 font-semibold border-r border-gray-600">{getTranslatedText('item')}</th>
                  <th className="text-center py-4 px-4 font-semibold border-r border-gray-600">{getTranslatedText('quantity')}</th>
                  <th className="text-right py-4 px-4 font-semibold border-r border-gray-600">{getTranslatedText('rate')}</th>
                  <th className="text-right py-4 px-4 font-semibold">{getTranslatedText('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((item, index) => (
                  <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="py-4 px-4 border-r border-gray-200">
                      {translateLineItemDescription(item.item_description, templateSettings.language)}
                    </td>
                    <td className="text-center py-4 px-4 border-r border-gray-200">{item.quantity}</td>
                    <td className="text-right py-4 px-4 border-r border-gray-200">{formatCurrency(item.unit_price, currentCurrency)}</td>
                    <td className="text-right py-4 px-4 font-semibold">{formatCurrency(item.quantity * item.unit_price * (1 - item.discount_rate), currentCurrency)}</td>
                  </tr>
                )) : (
                  <tr className="border-b bg-gray-50">
                    <td className="py-4 px-4 border-r border-gray-200">
                      {translateLineItemDescription('Sample Service', templateSettings.language)}
                    </td>
                    <td className="text-center py-4 px-4 border-r border-gray-200">1</td>
                    <td className="text-right py-4 px-4 border-r border-gray-200">{formatCurrency(750, currentCurrency)}</td>
                    <td className="text-right py-4 px-4 font-semibold">{formatCurrency(750, currentCurrency)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-8">
            <div className="w-80 bg-gray-50 p-5 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span>{getTranslatedText('subtotal')}</span>
                <span className="font-semibold">{formatCurrency(subtotal || 750, currentCurrency)}</span>
              </div>
              {templateSettings.vatEnabled && (
                <div className="flex justify-between text-sm">
                  <span>{getTranslatedText('tax')} ({templateSettings.vatRate || 21}%):</span>
                  <span className="font-semibold">{formatCurrency(vatAmount, currentCurrency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t-2 border-gray-700 pt-3 text-gray-700">
                <span>{getTranslatedText('total')}</span>
                <span>{formatCurrency(total || 750, currentCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="mt-10 grid grid-cols-2 gap-8">
            <div>
              <div className="font-bold text-gray-700 mb-3 text-lg">{getTranslatedText('notes')}</div>
              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed">
                {templateSettings.customTerms || 
                 "We verzoeken dat de door ons gefactureerde diensten binnen 3 dagen worden gecrediteerd/overgemaakt. Alle belastingen en sociale premies worden door ons aangegeven en afgedragen aan de autoriteiten."}
              </div>
            </div>
            
            <div>
              <div className="font-bold text-gray-700 mb-3 text-lg">{getTranslatedText('terms')}</div>
              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed">
                <div className="font-semibold mb-2">{selectedAccount.name}:</div>
                <div><strong>{getTranslatedText('iban')}:</strong> {selectedAccount.iban}</div>
                <div><strong>{getTranslatedText('bic')}:</strong> {selectedAccount.bic}</div>
                {selectedAccount.blz && <div><strong>{getTranslatedText('blz')}:</strong> {selectedAccount.blz} <strong>{getTranslatedText('account')}:</strong> {selectedAccount.account}</div>}
                {selectedAccount.bank && <div><strong>{getTranslatedText('bank')}:</strong> {selectedAccount.bank}</div>}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
