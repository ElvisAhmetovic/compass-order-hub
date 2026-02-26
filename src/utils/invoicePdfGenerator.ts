import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, InvoiceLineItem, Client } from '@/types/invoice';
import { formatCurrency } from '@/utils/currencyUtils';
import { sanitizeHtml } from '@/utils/sanitize';
import { getDefaultTerms } from '@/components/invoices/constants';

interface InvoicePDFData {
  invoice?: Invoice;
  lineItems: InvoiceLineItem[];
  client?: Client;
  templateSettings: any;
  formData?: any;
}

export const generateInvoicePDF = async (data: InvoicePDFData): Promise<void> => {
  const { invoice, lineItems, client, templateSettings, formData } = data;
  
  // Get the current currency from form data or template settings
  const currentCurrency = formData?.currency || templateSettings.currency || 'EUR';
  console.log('PDF Generator: Using currency:', currentCurrency);
  
  // Create a temporary container for the invoice
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width in pixels at 96 DPI
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  
  document.body.appendChild(container);

  try {
    // Generate the invoice HTML with the correct currency and sanitize it
    const invoiceHtml = generateInvoiceHTML({
      ...data,
      templateSettings: {
        ...templateSettings,
        currency: currentCurrency
      }
    });
    container.innerHTML = sanitizeHtml(invoiceHtml);
    
    // Wait for images to load
    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(null);
        } else {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
        }
      });
    }));

    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }
    
    // Download the PDF
    const invoiceNumber = invoice?.invoice_number || formData?.invoice_number || 'new';
    pdf.save(`invoice-${invoiceNumber}.pdf`);
    
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

export const generateInvoicePDFBase64 = async (data: InvoicePDFData): Promise<string> => {
  const { invoice, lineItems, client, templateSettings, formData } = data;
  const currentCurrency = formData?.currency || templateSettings.currency || 'EUR';

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(container);

  try {
    const invoiceHtml = generateInvoiceHTML({
      ...data,
      templateSettings: { ...templateSettings, currency: currentCurrency }
    });
    container.innerHTML = sanitizeHtml(invoiceHtml);

    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img =>
      new Promise((resolve) => {
        if (img.complete) resolve(null);
        else { img.onload = () => resolve(null); img.onerror = () => resolve(null); }
      })
    ));

    const canvas = await html2canvas(container, {
      scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    return pdf.output('datauristring');
  } finally {
    document.body.removeChild(container);
  }
};

const generateInvoiceHTML = (data: InvoicePDFData): string => {
  const { invoice, lineItems, client, templateSettings, formData } = data;
  
  // Get the current currency
  const currentCurrency = templateSettings.currency || 'EUR';
  console.log('PDF HTML Generator: Using currency:', currentCurrency);
  
  // Get saved logo from localStorage or use the one from template settings
  const getSavedLogo = () => {
    try {
      const savedSettings = localStorage.getItem('invoiceTemplateSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.logo || templateSettings.logo;
      }
    } catch (error) {
      console.log('No saved logo found, using template settings');
    }
    return templateSettings.logo;
  };

  const logoUrl = getSavedLogo();
  
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

  const belgiumAccount = {
    id: "belgium",
    name: getAccountTranslations(templateSettings.language, "belgium"),
    iban: "BE79967023897833",
    bic: "TRWIBEB1XXX",
    blz: "967",
    account: "967023897833",
    bank: undefined as string | undefined
  };

  const germanyAccount = {
    id: "germany",
    name: getAccountTranslations(templateSettings.language, "germany"),
    iban: "DE91240703680071572200",
    bic: "DEUTDE2HP22",
    bank: "Postbank/DSL Ndl of Deutsche Bank",
    blz: undefined as string | undefined,
    account: undefined as string | undefined
  };

  const selectedAccounts = templateSettings.selectedPaymentAccount === "both"
    ? [belgiumAccount, germanyAccount]
    : templateSettings.selectedPaymentAccount === "belgium"
      ? [belgiumAccount]
      : [germanyAccount];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
        bankDetails: "Bank Details:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "ACCOUNT",
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
        bankDetails: "Bankgegevens:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "REKENING",
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
        bankDetails: "Bankverbindung:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "KONTO",
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
        bankDetails: "Coordonnées bancaires:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "COMPTE",
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
        bankDetails: "Datos bancarios:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "CUENTA",
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
        bankDetails: "Bankoplysninger:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "KONTO",
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
        bankDetails: "Bankdetaljer:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "KONTO",
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
        bankDetails: "Bankovní údaje:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "ÚČET",
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
        bankDetails: "Dane bankowe:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "KONTO",
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
        bankDetails: "Bankuppgifter:",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "KONTO",
        bank: "Bank",
        contactPerson: "Kontaktperson:",
        companyRegistrationNumber: "Företagsregistreringsnummer:",
        uidNumber: "UID-nummer:"
      }
    };
    
    const lang = templateSettings.language || 'en';
    return translations[lang]?.[key] || translations.en[key];
  };

  const currentInvoiceData = invoice || {
    invoice_number: formData?.invoice_number || 'NEW',
    issue_date: formData?.issue_date || new Date().toISOString(),
    due_date: formData?.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString()
  };

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

  return `
    <div style="background: white; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; line-height: 1.3; color: #333;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${logoUrl ? `
            <img 
              src="${logoUrl}" 
              alt="Company Logo" 
              style="height: ${
                templateSettings.logoSize === "small" ? "60px" :
                templateSettings.logoSize === "medium" ? "80px" :
                "120px"
              }; width: auto; object-fit: contain;"
            />
          ` : ''}
          <div>
            <h1 style="font-size: 22px; font-weight: bold; color: #1f2937; margin: 0; margin-bottom: 4px;">
              ${companyInfo.name}
            </h1>
            <div style="font-size: 11px; color: #6b7280; line-height: 1.5;">
              ${companyInfo.contactPerson ? `${getTranslatedText('contactPerson')} ${companyInfo.contactPerson}<br>` : ''}
              ${getTranslatedText('companyRegistrationNumber')} ${companyInfo.registrationNumber}<br>
              ${getTranslatedText('uidNumber')} ${companyInfo.vatId}<br>
              ${companyInfo.street} ${companyInfo.postal} ${companyInfo.city}<br>
              ${companyInfo.email}
            </div>
          </div>
        </div>
        
        <div style="text-align: right;">
          <h2 style="font-size: 28px; font-weight: bold; color: #374151; margin: 0; margin-bottom: 4px;">
            ${templateSettings.invoiceNumberPrefix || 'RE NR:'}${currentInvoiceData.invoice_number}
          </h2>
          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            # ${templateSettings.invoiceNumberPrefix || 'RE NR:'}${currentInvoiceData.invoice_number}
          </p>
        </div>
      </div>

      <!-- Client Info and Invoice Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div>
          <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 14px;">${getTranslatedText('billTo')}</div>
          <div style="font-size: 13px; color: #374151; line-height: 1.5; background: #f9fafb; padding: 10px; border-radius: 8px;">
            ${client ? `
              <div style="font-weight: bold; margin-bottom: 2px;">${client.name}</div>
              <div>${client.email}</div>
              ${client.address ? `<div>${client.address}</div>` : ''}
              ${client.city ? `<div>${client.zip_code} ${client.city}</div>` : ''}
              ${client.country ? `<div>${client.country}</div>` : ''}
            ` : `
              <div style="font-weight: bold;">Client Name</div>
              <div>client@email.com</div>
              <div>Client Address</div>
              <div>City, Country</div>
            `}
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600;">${getTranslatedText('date')}</span>
            <span>${formatDate(currentInvoiceData.issue_date)}</span>
          </div>
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600;">${getTranslatedText('dueDate')}</span>
            <span>${formatDate(currentInvoiceData.due_date)}</span>
          </div>
          <div style="font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            <span>${getTranslatedText('balanceDue')}</span>
            <span>${formatCurrency(total || 750, currentCurrency)}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Items Table -->
      <div style="margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #374151; color: white;">
              <th style="text-align: left; padding: 8px; font-weight: 600; border-right: 1px solid #4b5563;">${getTranslatedText('item')}</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; border-right: 1px solid #4b5563;">${getTranslatedText('quantity')}</th>
              <th style="text-align: right; padding: 8px; font-weight: 600; border-right: 1px solid #4b5563;">${getTranslatedText('rate')}</th>
              <th style="text-align: right; padding: 8px; font-weight: 600;">${getTranslatedText('amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.length > 0 ? lineItems.map((item, index) => `
              <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background: #f9fafb;' : 'background: white;'}">
                <td style="padding: 8px; border-right: 1px solid #e5e7eb;">${translateLineItemDescription(item.item_description, templateSettings.language)}</td>
                <td style="text-align: center; padding: 8px; border-right: 1px solid #e5e7eb;">${item.quantity}</td>
                <td style="text-align: right; padding: 8px; border-right: 1px solid #e5e7eb;">${formatCurrency(item.unit_price, currentCurrency)}</td>
                <td style="text-align: right; padding: 8px; font-weight: 600;">${formatCurrency(item.quantity * item.unit_price * (1 - item.discount_rate), currentCurrency)}</td>
              </tr>
            `).join('') : `
              <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <td style="padding: 8px; border-right: 1px solid #e5e7eb;">${translateLineItemDescription('Sample Service', templateSettings.language)}</td>
                <td style="text-align: center; padding: 8px; border-right: 1px solid #e5e7eb;">1</td>
                <td style="text-align: right; padding: 8px; border-right: 1px solid #e5e7eb;">${formatCurrency(750, currentCurrency)}</td>
                <td style="text-align: right; padding: 8px; font-weight: 600;">${formatCurrency(750, currentCurrency)}</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin: 12px 0;">
        <div style="width: 300px; background: #f9fafb; padding: 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span>${getTranslatedText('subtotal')}</span>
            <span style="font-weight: 600;">${formatCurrency(subtotal || 750, currentCurrency)}</span>
          </div>
          ${templateSettings.vatEnabled ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span>${getTranslatedText('tax')} (${templateSettings.vatRate || 21}%):</span>
              <span style="font-weight: 600;">${formatCurrency(vatAmount, currentCurrency)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 2px solid #374151; padding-top: 8px; color: #374151;">
            <span>${getTranslatedText('total')}</span>
            <span>${formatCurrency(total || 750, currentCurrency)}</span>
          </div>
        </div>
      </div>

      <!-- Notes and Terms -->
      <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 14px;">${getTranslatedText('notes')}</div>
          <div style="font-size: 12px; color: #4b5563; line-height: 1.5; background: #f9fafb; padding: 10px; border-radius: 8px;">
            ${templateSettings.customTerms || formData?.notes || getDefaultTerms(templateSettings.language)}
          </div>
        </div>
        
        <div>
          <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 14px;">${getTranslatedText('bankDetails')}</div>
          <div style="font-size: 12px; color: #4b5563; line-height: 1.5; background: #f9fafb; padding: 10px; border-radius: 8px;">
            ${selectedAccounts.map((account, idx) => `
              <div${idx > 0 ? ' style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;"' : ''}>
                <div style="font-weight: 600; margin-bottom: 4px;">${account.name}:</div>
                <div><strong>${getTranslatedText('iban')}:</strong> ${account.iban}</div>
                <div><strong>${getTranslatedText('bic')}:</strong> ${account.bic}</div>
                ${account.blz ? `<div><strong>${getTranslatedText('blz')}:</strong> ${account.blz} <strong>${getTranslatedText('account')}:</strong> ${account.account}</div>` : ''}
                ${account.bank ? `<div><strong>${getTranslatedText('bank')}:</strong> ${account.bank}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
};
