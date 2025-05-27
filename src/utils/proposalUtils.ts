import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Proposal, ProposalLineItem, InventoryItem } from "@/types";

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

// Professional PDF content with reorganized layout for better page flow
const createPDFContent = (proposalData: any, language: string = "en") => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();

  // Global scaling factor for better fit - reduces size by 8% for optimal fitting
  const scaleFactor = 0.92;
  
  // Calculate responsive dimensions with scaling
  const baseFontSize = Math.round(12 * scaleFactor);
  const headerFontSize = Math.round(22 * scaleFactor);
  const titleFontSize = Math.round(18 * scaleFactor);
  const lineHeight = 1.4;
  const sectionSpacing = Math.round(25 * scaleFactor);
  const elementPadding = Math.round(16 * scaleFactor);

  // Calculate logo width based on logoSize
  const logoWidth = proposalData.logoSize ? `${proposalData.logoSize}%` : '33%';

  // Proper VAT handling with all user data
  console.log('PDF Generation - All proposal data:', proposalData);
  console.log('PDF Generation - Company info:', companyInfo);
  const isVatEnabled = proposalData.vatEnabled === true;
  const netAmount = proposalData.netAmount || 0;
  const vatRate = proposalData.vatRate || 0;
  const vatAmount = isVatEnabled ? (netAmount * vatRate / 100) : 0;
  const totalAmount = isVatEnabled ? (netAmount + vatAmount) : netAmount;

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'EUR':
      default: return '€';
    }
  };

  const currencySymbol = getCurrencySymbol(proposalData.currency || 'EUR');

  // Use proposal payment data if available, otherwise fall back to company info
  const paymentAccountNumber = proposalData.accountNumber || companyInfo.accountNumber || '12345678901234567';
  const paymentAccountName = proposalData.accountName || companyInfo.accountHolder || 'YOUR NAME';
  const paymentMethodValue = proposalData.paymentMethod || companyInfo.paymentMethod || 'CREDIT CARD';

  // Format the proposal date properly
  const proposalDate = proposalData.proposalDate ? new Date(proposalData.proposalDate).toLocaleDateString() : new Date(proposalData.created_at || Date.now()).toLocaleDateString();

  console.log('PDF Generation - Reorganized layout with PAYMENT DATA on page 2:', {
    scaleFactor,
    baseFontSize,
    headerFontSize,
    titleFontSize,
    customerName: proposalData.customerName,
    proposalTitle: proposalData.proposalTitle,
    lineItems: proposalData.lineItems,
    vatEnabled: isVatEnabled,
    netAmount,
    vatAmount,
    totalAmount,
    proposalDate
  });

  return `
    <div style="font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; padding: ${Math.round(32 * scaleFactor)}px; max-width: 794px; min-height: auto; background: #ffffff; margin: 0; box-sizing: border-box; font-size: ${baseFontSize}px; line-height: ${lineHeight}; color: #2d3748; position: relative;">
      
      <!-- PAGE 1 CONTENT -->
      
      <!-- Header Section with Optimized Design -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${Math.round(35 * scaleFactor)}px; padding-bottom: ${Math.round(16 * scaleFactor)}px; border-bottom: 2px solid #e2e8f0;">
        <div style="flex: 1; max-width: 60%;">
          <div style="font-weight: 600; font-size: ${headerFontSize}px; margin-bottom: ${Math.round(10 * scaleFactor)}px; color: #1a202c; letter-spacing: -0.3px;">${companyInfo.name}</div>
          <div style="line-height: ${lineHeight}; color: #4a5568; font-size: ${Math.round(13 * scaleFactor)}px;">
            <div style="margin-bottom: 2px;">${companyInfo.street}</div>
            <div style="margin-bottom: 2px;">${companyInfo.postal} ${companyInfo.city}</div>
            <div style="color: #718096; font-size: ${Math.round(12 * scaleFactor)}px;">${companyInfo.country || 'Germany'}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #f7fafc; padding: ${Math.round(10 * scaleFactor)}px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: ${Math.round(10 * scaleFactor)}px;">
            <img src="${proposalData.logo || companyInfo.logo}" style="max-height: ${Math.round(60 * scaleFactor)}px; max-width: ${logoWidth};" onerror="this.src='https://placehold.co/200x60?text=Your+Logo'; this.onerror=null;" />
          </div>
        </div>
      </div>

      <!-- Customer Information and Proposal Details with Better Spacing -->
      <div style="display: flex; justify-content: space-between; margin-bottom: ${Math.round(30 * scaleFactor)}px; gap: ${Math.round(24 * scaleFactor)}px;">
        <div style="flex: 1; background: #f8fafc; padding: ${elementPadding}px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-weight: 600; font-size: ${Math.round(13 * scaleFactor)}px; margin-bottom: ${Math.round(12 * scaleFactor)}px; color: #2d3748; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #cbd5e0; padding-bottom: 4px;">${t.customer}</div>
          <div style="line-height: ${lineHeight}; font-size: ${Math.round(12 * scaleFactor)}px;">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: ${Math.round(14 * scaleFactor)}px; color: #2d3748;">${proposalData.customerName || proposalData.customer || 'Name Surname'}</div>
            <div style="margin-bottom: 4px; color: #4a5568;">${proposalData.customerAddress || 'Leidsestraat 15, 2000 Antwerpen'}</div>
            <div style="margin-bottom: 4px; color: #4a5568;">${proposalData.customerEmail || 'customer@email.com'}</div>
            <div style="color: #718096; font-weight: 500;">${proposalData.customerCountry || 'Belgium'}</div>
          </div>
        </div>
        
        <div style="flex: 0 0 auto; min-width: ${Math.round(240 * scaleFactor)}px;">
          <div style="background: #f8fafc; padding: ${elementPadding}px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: ${Math.round(10 * scaleFactor)}px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${Math.round(11 * scaleFactor)}px;">Proposal no.</span>
              <span style="font-weight: 600; color: #2d3748; font-size: ${Math.round(12 * scaleFactor)}px;">${proposalData.number || 'AN-9993'}</span>
            </div>
            <div style="margin-bottom: ${Math.round(10 * scaleFactor)}px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${Math.round(11 * scaleFactor)}px;">${t.date}</span>
              <span style="color: #4a5568; font-weight: 500; font-size: ${Math.round(11 * scaleFactor)}px;">${proposalDate}</span>
            </div>
            <div style="margin-bottom: ${Math.round(10 * scaleFactor)}px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${Math.round(11 * scaleFactor)}px;">${t.customerRef}</span>
              <span style="color: #4a5568; font-weight: 500; font-size: ${Math.round(11 * scaleFactor)}px;">${proposalData.customerRef || proposalData.reference || '—'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${Math.round(11 * scaleFactor)}px;">${t.yourContact}</span>
              <span style="color: #4a5568; font-weight: 500; font-size: ${Math.round(11 * scaleFactor)}px;">${proposalData.yourContact || proposalData.internalContact || 'Thomas Klein'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Optimized Proposal Title -->
      <div style="background: #2d3748; color: white; padding: ${elementPadding}px; border-radius: 5px; margin-bottom: ${sectionSpacing}px;">
        <h2 style="margin: 0; font-size: ${titleFontSize}px; font-weight: 600; letter-spacing: -0.2px;">
          ${t.proposal} ${proposalData.number || 'AN-9993'}
        </h2>
      </div>

      <!-- Optimized Proposal Content -->
      <div style="margin-bottom: ${sectionSpacing}px; background: white; padding: ${elementPadding}px; border-radius: 5px; border: 1px solid #e2e8f0;">
        <div style="line-height: ${lineHeight}; font-size: ${Math.round(12 * scaleFactor)}px;">
          <div style="font-weight: 600; font-size: ${Math.round(15 * scaleFactor)}px; color: #2d3748; margin-bottom: ${Math.round(10 * scaleFactor)}px;">
            ${proposalData.proposalTitle || proposalData.subject || 'Protect your online REPUTATION!'}
          </div>
          <div style="color: #4a5568; line-height: ${lineHeight};">
            ${proposalData.proposalDescription || 'Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.'}
            ${proposalData.content ? `<br/><br/>${proposalData.content}` : ''}
          </div>
        </div>
      </div>

      <!-- Optimized Products/Services Table -->
      <div style="margin-bottom: ${Math.round(28 * scaleFactor)}px; border-radius: 5px; overflow: hidden; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse; font-size: ${Math.round(11 * scaleFactor)}px; background: white;">
          <thead>
            <tr style="background: #2d3748; color: white;">
              <th style="padding: ${Math.round(12 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; text-align: left; font-weight: 600; border: none; width: 50%; font-size: ${Math.round(11 * scaleFactor)}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.productDescription}</th>
              <th style="padding: ${Math.round(12 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; text-align: center; font-weight: 600; border: none; width: 16%; font-size: ${Math.round(11 * scaleFactor)}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.price}</th>
              <th style="padding: ${Math.round(12 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; text-align: center; font-weight: 600; border: none; width: 14%; font-size: ${Math.round(11 * scaleFactor)}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.qty}</th>
              <th style="padding: ${Math.round(12 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; text-align: right; font-weight: 600; border: none; width: 20%; font-size: ${Math.round(11 * scaleFactor)}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.total}</th>
            </tr>
          </thead>
          <tbody>
            ${(proposalData.lineItems || []).map((item: any, index: number) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
                <td style="padding: ${Math.round(13 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; border: none; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; color: #2d3748; font-size: ${Math.round(12 * scaleFactor)}px; line-height: 1.3;">
                    ${item.name || 'Product/Service Name'}
                  </div>
                  ${item.description || item.additionalInfo ? `
                  <div style="line-height: 1.4; color: #718096; font-size: ${Math.round(10 * scaleFactor)}px; margin-top: 4px;">
                    ${item.description || item.additionalInfo || ''}
                  </div>
                  ` : ''}
                </td>
                <td style="padding: ${Math.round(13 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; border: none; text-align: center; vertical-align: top; font-weight: 500; color: #4a5568; font-size: ${Math.round(11 * scaleFactor)}px;">
                  ${currencySymbol}${(item.unit_price || 0).toFixed(2)}
                </td>
                <td style="padding: ${Math.round(13 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; border: none; text-align: center; vertical-align: top; font-weight: 500; color: #4a5568; font-size: ${Math.round(11 * scaleFactor)}px;">
                  ${item.quantity || 1}
                </td>
                <td style="padding: ${Math.round(13 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px; border: none; text-align: right; vertical-align: top; font-weight: 600; font-size: ${Math.round(12 * scaleFactor)}px; color: #2d3748;">
                  ${currencySymbol}${(item.total_price || 0).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Optimized Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: ${Math.round(25 * scaleFactor)}px;">
        <div style="width: ${Math.round(290 * scaleFactor)}px; background: white; border-radius: 5px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: #4a5568; color: white; padding: ${Math.round(10 * scaleFactor)}px ${Math.round(16 * scaleFactor)}px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2px; font-size: ${Math.round(11 * scaleFactor)}px;">
            Summary
          </div>
          <div style="padding: ${Math.round(14 * scaleFactor)}px ${Math.round(16 * scaleFactor)}px;">
            <div style="display: flex; justify-content: space-between; padding: ${Math.round(8 * scaleFactor)}px 0; border-bottom: 1px solid #e2e8f0; font-size: ${Math.round(12 * scaleFactor)}px;">
              <span style="color: #718096; font-weight: 500;">${t.subtotal}</span>
              <span style="font-weight: 600; color: #2d3748;">${currencySymbol}${netAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: ${Math.round(8 * scaleFactor)}px 0; border-bottom: 1px solid #e2e8f0; font-size: ${Math.round(12 * scaleFactor)}px;">
              <span style="color: #718096; font-weight: 500;">${t.vat} ${isVatEnabled ? `${vatRate}%` : '0%'}</span>
              <span style="font-weight: 600; color: #2d3748;">${currencySymbol}${vatAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: ${Math.round(12 * scaleFactor)}px 0; font-weight: 700; font-size: ${Math.round(14 * scaleFactor)}px; background: #2d3748; color: white; margin: ${Math.round(10 * scaleFactor)}px -${Math.round(16 * scaleFactor)}px -${Math.round(14 * scaleFactor)}px -${Math.round(16 * scaleFactor)}px; padding-left: ${Math.round(16 * scaleFactor)}px; padding-right: ${Math.round(16 * scaleFactor)}px;">
              <span>${t.totalAmount}</span>
              <span>${currencySymbol}${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TERMS AND CONDITIONS - Positioned on First Page -->
      <div style="margin-bottom: ${Math.round(20 * scaleFactor)}px; background: white; padding: ${elementPadding}px; border-radius: 5px; border: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
        <div style="font-weight: 600; margin-bottom: ${Math.round(10 * scaleFactor)}px; text-transform: uppercase; color: #2d3748; font-size: ${Math.round(12 * scaleFactor)}px; letter-spacing: 0.2px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          ${t.termsAndConditions}
        </div>
        <div style="line-height: ${lineHeight}; font-size: ${Math.round(11 * scaleFactor)}px; color: #4a5568;">
          ${proposalData.paymentTerms || proposalData.deliveryTerms || t.paymentTerms}
          ${proposalData.termsAndConditions ? `<br/><br/>${proposalData.termsAndConditions}` : ''}
        </div>
      </div>

      <!-- Signature Section - Positioned on First Page after Terms -->
      <div style="display: flex; justify-content: space-between; margin-bottom: ${Math.round(30 * scaleFactor)}px; gap: ${Math.round(24 * scaleFactor)}px;">
        <div style="width: 45%; background: white; padding: ${Math.round(12 * scaleFactor)}px; border-radius: 5px; border: 1px solid #e2e8f0;">
          <div style="border-top: 2px solid #2d3748; padding-top: ${Math.round(8 * scaleFactor)}px;">
            <div style="font-size: ${Math.round(10 * scaleFactor)}px; color: #718096; font-weight: 500; text-transform: uppercase; letter-spacing: 0.2px;">${t.placeDate}</div>
          </div>
        </div>
        <div style="width: 45%; background: white; padding: ${Math.round(12 * scaleFactor)}px; border-radius: 5px; border: 1px solid #e2e8f0;">
          <div style="border-top: 2px solid #2d3748; padding-top: ${Math.round(8 * scaleFactor)}px;">
            <div style="font-size: ${Math.round(10 * scaleFactor)}px; color: #718096; font-weight: 500; text-transform: uppercase; letter-spacing: 0.2px;">${t.signatureStamp}</div>
            ${proposalData.signatureUrl ? `<img src="${proposalData.signatureUrl}" style="max-height: ${Math.round(32 * scaleFactor)}px; margin-top: ${Math.round(8 * scaleFactor)}px;" />` : ''}
          </div>
        </div>
      </div>

      <!-- FORCE PAGE BREAK BEFORE PAGE 2 CONTENT -->
      <div style="page-break-before: always; break-before: page; height: 0; overflow: hidden; margin: 0; padding: 0; border: none; visibility: hidden;"><!-- PAGE BREAK --></div>

      <!-- PAGE 2 CONTENT STARTS HERE -->
      
      <!-- PAYMENT DATA Section - Now on Second Page -->
      <div style="margin-bottom: ${Math.round(30 * scaleFactor)}px; background: #f0fff4; padding: ${elementPadding}px; border-radius: 6px; border-left: 4px solid #38a169; border: 1px solid #c6f6d5; box-sizing: border-box; overflow: visible; page-break-inside: avoid; break-inside: avoid; position: relative; z-index: 10; min-height: ${Math.round(120 * scaleFactor)}px; display: block; clear: both; margin-top: ${Math.round(40 * scaleFactor)}px;">
        <div style="font-weight: 600; margin-bottom: ${Math.round(12 * scaleFactor)}px; color: #2f855a; font-size: ${Math.round(13 * scaleFactor)}px; text-transform: uppercase; letter-spacing: 0.2px; padding-top: 2px;">
          ${t.paymentData}
        </div>
        <div style="line-height: 1.6; font-size: ${Math.round(12 * scaleFactor)}px; color: #2f855a;">
          <div style="margin-bottom: ${Math.round(8 * scaleFactor)}px; display: flex; align-items: center;">
            <strong style="min-width: ${Math.round(120 * scaleFactor)}px; display: inline-block;">${t.accountNr}</strong> 
            <span>${paymentAccountNumber}</span>
          </div>
          <div style="margin-bottom: ${Math.round(8 * scaleFactor)}px; display: flex; align-items: center;">
            <strong style="min-width: ${Math.round(120 * scaleFactor)}px; display: inline-block;">${t.name}</strong> 
            <span>${paymentAccountName}</span>
          </div>
          <div style="display: flex; align-items: center;">
            <strong style="min-width: ${Math.round(120 * scaleFactor)}px; display: inline-block;">${t.paymentMethod}</strong> 
            <span>${paymentMethodValue}</span>
          </div>
        </div>
      </div>

      <!-- Footer Content - On Second Page if Present -->
      ${proposalData.footerContent ? `
      <div style="margin-bottom: ${Math.round(20 * scaleFactor)}px; padding: ${elementPadding}px; background: #faf5ff; border-radius: 5px; border-left: 4px solid #805ad5; border: 1px solid #e9d8fd; page-break-inside: avoid; break-inside: avoid;">
        <div style="line-height: ${lineHeight}; font-size: ${Math.round(11 * scaleFactor)}px; color: #553c9a;">
          ${proposalData.footerContent}
        </div>
      </div>
      ` : ''}

      <!-- COMPANY FOOTER - On Second Page -->
      <div style="background: #2d3748; border-radius: 5px; margin-top: ${Math.round(30 * scaleFactor)}px; width: 100%; clear: both; position: relative; page-break-inside: avoid; break-inside: avoid; box-sizing: border-box; z-index: 20; min-height: ${Math.round(140 * scaleFactor)}px;">
        <!-- Company Name Header -->
        <div style="background: rgba(255,255,255,0.1); padding: ${Math.round(8 * scaleFactor)}px ${Math.round(16 * scaleFactor)}px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div style="color: white; font-weight: 600; font-size: ${Math.round(11 * scaleFactor)}px; text-align: center; letter-spacing: 0.4px;">
            ${companyInfo.name || 'AB MEDIA TEAM LTD'}
          </div>
        </div>
        
        <!-- Contact Information Grid -->
        <div style="padding: ${Math.round(12 * scaleFactor)}px ${Math.round(16 * scaleFactor)}px; color: white; font-size: ${Math.round(9 * scaleFactor)}px;">
          
          <!-- Phone & Fax -->
          <div style="margin-bottom: ${Math.round(8 * scaleFactor)}px;">
            <div style="display: inline-block; width: 33%; vertical-align: top;">
              <div style="margin-bottom: 4px;">
                <span style="font-weight: 500; margin-right: 6px; color: #cbd5e0;">Tel:</span>
                <span>${companyInfo.phone || '+49 203 70 90 72 62'}</span>
              </div>
              <div>
                <span style="font-weight: 500; margin-right: 6px; color: #cbd5e0;">Fax:</span>
                <span>${companyInfo.fax || '+49 203 70 90 73 53'}</span>
              </div>
            </div>
            
            <!-- Email & Website -->
            <div style="display: inline-block; width: 33%; vertical-align: top;">
              <div style="margin-bottom: 4px;">
                <span style="font-weight: 500; margin-right: 6px; color: #cbd5e0;">Email:</span>
                <span>${companyInfo.email || 'kontakt.abmedia@gmail.com'}</span>
              </div>
              <div>
                <span style="font-weight: 500; margin-right: 6px; color: #cbd5e0;">Web:</span>
                <span>${companyInfo.website || 'www.abmedia-team.com'}</span>
              </div>
            </div>
            
            <!-- Address & Contact Person -->
            <div style="display: inline-block; width: 33%; vertical-align: top; text-align: right;">
              <div style="font-weight: 500; margin-bottom: 3px; color: #cbd5e0; font-size: ${Math.round(9 * scaleFactor)}px;">
                ${companyInfo.contactPerson || 'Andreas Berger'}
              </div>
              <div style="line-height: 1.3; font-size: ${Math.round(8 * scaleFactor)}px;">
                ${companyInfo.street || 'Weseler Str.73'}<br/>
                ${companyInfo.postal || '47169'} ${companyInfo.city || 'Duisburg'}<br/>
                ${companyInfo.country || 'Germany'}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Business Information -->
        <div style="background: rgba(255,255,255,0.05); padding: ${Math.round(8 * scaleFactor)}px ${Math.round(16 * scaleFactor)}px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="color: #cbd5e0; font-size: ${Math.round(8 * scaleFactor)}px;">
            <div style="display: inline-block; width: 70%; vertical-align: top;">
              <span style="margin-right: 12px;">REG: ${companyInfo.registrationNumber || '15748871'}</span>
              <span style="margin-right: 12px;">VAT: ${companyInfo.vatId || 'DE123418679'}</span>
              <span>TAX: ${companyInfo.taxNumber || '13426 27369'}</span>
            </div>
            <div style="display: inline-block; width: 30%; text-align: right; vertical-align: top;">
              <span style="font-weight: 500;">Director: ${companyInfo.director || 'Andreas Berger'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Improved PDF generation with better height calculation and layout handling
const generatePDFFromHTML = async (htmlContent: string): Promise<jsPDF> => {
  // Create a temporary div to render the proposal with optimized height
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  tempDiv.style.width = "794px"; // A4 width in pixels at 96 DPI
  tempDiv.style.minHeight = "1600px"; // Increased minimum height for better content flow
  tempDiv.style.backgroundColor = "white";
  tempDiv.style.overflow = "visible";
  
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);
  
  // Wait for any images to load and layout to stabilize
  await new Promise(resolve => setTimeout(resolve, 800));
  
  try {
    // Get the actual content height with buffer for footer
    const actualHeight = Math.max(tempDiv.scrollHeight + 100, 1600);
    
    console.log('PDF Generation - Optimized content height:', actualHeight);
    
    // Convert the HTML to canvas with optimized settings
    const canvas = await html2canvas(tempDiv, {
      scale: 1.4, // Slightly reduced scale for better performance
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: actualHeight,
      windowWidth: 794,
      windowHeight: actualHeight,
      onclone: (clonedDoc) => {
        // Ensure all elements are properly rendered in the clone
        const paymentSection = clonedDoc.querySelector('[style*="PAYMENT DATA"]');
        if (paymentSection) {
          (paymentSection as HTMLElement).style.pageBreakInside = 'avoid';
          (paymentSection as HTMLElement).style.breakInside = 'avoid';
        }
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit content properly
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Handle multi-page content with improved page breaks
    if (imgHeight > pdfHeight) {
      const pageCount = Math.ceil(imgHeight / pdfHeight);
      
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yOffset = -(i * pdfHeight);
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      }
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }
    
    console.log('PDF Generation - Layout optimized with scaling and improved positioning');
    
    return pdf;
  } finally {
    document.body.removeChild(tempDiv);
  }
};

// Main function to generate a PDF from a proposal - now with optimized layout
export const generateProposalPDF = async (
  proposalData: any, 
  language: string = "en", 
  customFilename?: string
): Promise<jsPDF | boolean> => {
  try {
    console.log('Generating optimized PDF with data:', proposalData);
    
    // Generate HTML content using optimized scaling and layout
    const htmlContent = createPDFContent(proposalData, language);
    
    // Generate PDF with improved layout handling
    const pdf = await generatePDFFromHTML(htmlContent);
    
    // For preview mode, return the PDF document
    if (proposalData.previewMode) {
      return pdf;
    }
    
    // For download mode, save the PDF with custom filename if provided
    const filename = customFilename || `proposal_${proposalData.number || 'draft'}.pdf`;
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("PDF generation error:", error);
    return false;
  }
};

// Updated preview function to show exact PDF output
export const previewProposalPDF = async (proposalData: any, language: string = "en") => {
  try {
    // Generate PDF using the centralized function - this ensures identical output
    const pdfResult = await generateProposalPDF({...proposalData, previewMode: true}, language);
    
    // Check if the result is a jsPDF instance
    if (!pdfResult || typeof pdfResult === 'boolean') {
      console.error("Failed to generate PDF preview");
      return false;
    }
    
    const pdf = pdfResult as jsPDF;
    
    // Convert the PDF to a data URL - this shows exactly what will be downloaded
    const dataUrl = pdf.output('datauristring');
    
    // Remove any existing PDF preview
    const existingOverlay = document.getElementById("pdf-preview-overlay");
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }
    
    // Create a modal to display the PDF with exact output
    const modalOverlay = document.createElement("div");
    modalOverlay.style.position = "fixed";
    modalOverlay.style.top = "0";
    modalOverlay.style.left = "0";
    modalOverlay.style.width = "100%";
    modalOverlay.style.height = "100%";
    modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    modalOverlay.style.zIndex = "9999";
    modalOverlay.style.display = "flex";
    modalOverlay.style.flexDirection = "column";
    modalOverlay.style.alignItems = "center";
    modalOverlay.style.justifyContent = "center";
    modalOverlay.id = "pdf-preview-overlay";
    
    // Create controls for the preview
    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.justifyContent = "space-between";
    controls.style.width = "80%";
    controls.style.maxWidth = "1000px";
    controls.style.padding = "10px";
    controls.style.backgroundColor = "white";
    controls.style.borderRadius = "8px 8px 0 0";
    
    // Create language selector
    const languageSelector = document.createElement("select");
    languageSelector.style.padding = "8px";
    languageSelector.style.borderRadius = "4px";
    languageSelector.style.marginRight = "8px";
    
    // Add language options
    PROPOSAL_LANGUAGES.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang.code;
      option.text = lang.name;
      option.selected = lang.code === language;
      languageSelector.appendChild(option);
    });
    
    // Create logo size controls
    const logoSizeControls = document.createElement("div");
    logoSizeControls.style.display = "flex";
    logoSizeControls.style.alignItems = "center";
    logoSizeControls.style.marginLeft = "16px";
    
    const logoSizeLabel = document.createElement("span");
    logoSizeLabel.textContent = "Logo Size:";
    logoSizeLabel.style.marginRight = "8px";
    
    const decreaseButton = document.createElement("button");
    decreaseButton.textContent = "-";
    decreaseButton.style.padding = "4px 8px";
    decreaseButton.style.borderRadius = "4px";
    decreaseButton.style.border = "1px solid #ccc";
    decreaseButton.style.marginRight = "8px";
    decreaseButton.style.cursor = "pointer";
    
    const logoSizeValue = document.createElement("span");
    logoSizeValue.textContent = `${proposalData.logoSize || 33}%`;
    logoSizeValue.style.marginRight = "8px";
    logoSizeValue.style.minWidth = "40px";
    logoSizeValue.style.textAlign = "center";
    
    const increaseButton = document.createElement("button");
    increaseButton.textContent = "+";
    increaseButton.style.padding = "4px 8px";
    increaseButton.style.borderRadius = "4px";
    increaseButton.style.border = "1px solid #ccc";
    increaseButton.style.cursor = "pointer";
    
    // Add logo size controls to the container
    logoSizeControls.appendChild(logoSizeLabel);
    logoSizeControls.appendChild(decreaseButton);
    logoSizeControls.appendChild(logoSizeValue);
    logoSizeControls.appendChild(increaseButton);
    
    // Create left side controls div
    const leftControls = document.createElement("div");
    leftControls.style.display = "flex";
    leftControls.style.alignItems = "center";
    leftControls.appendChild(document.createTextNode("Language: "));
    leftControls.appendChild(languageSelector);
    leftControls.appendChild(logoSizeControls);
    
    // Create close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.padding = "8px 16px";
    closeButton.style.backgroundColor = "#f44336";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = () => {
      document.body.removeChild(modalOverlay);
    };
    
    // Create download button
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Download PDF";
    downloadButton.style.padding = "8px 16px";
    downloadButton.style.backgroundColor = "#4CAF50";
    downloadButton.style.color = "white";
    downloadButton.style.border = "none";
    downloadButton.style.borderRadius = "4px";
    downloadButton.style.cursor = "pointer";
    downloadButton.style.marginRight = "8px";
    downloadButton.onclick = async () => {
      await generateProposalPDF({...proposalData, logoSize: parseInt(logoSizeValue.textContent || '33')}, languageSelector.value);
    };
    
    // Create right side controls div
    const rightControls = document.createElement("div");
    rightControls.appendChild(downloadButton);
    rightControls.appendChild(closeButton);
    
    // Add controls to the controls div
    controls.appendChild(leftControls);
    controls.appendChild(rightControls);
    
    // Create iframe to display the PDF - shows exact output
    const iframe = document.createElement("iframe");
    iframe.src = dataUrl;
    iframe.style.width = "80%";
    iframe.style.maxWidth = "1000px";
    iframe.style.height = "80%";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "white";
    iframe.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    iframe.style.borderRadius = "0 0 8px 8px";

    // Handler for logo size adjustment - regenerates identical PDF
    let currentLogoSize = proposalData.logoSize || 33;

    const updatePreview = async (newLogoSize: number, newLanguage: string) => {
      const updatedProposalData = {
        ...proposalData, 
        previewMode: true,
        logoSize: newLogoSize
      };
      
      // Generate new PDF with identical settings
      const newPdfResult = await generateProposalPDF(updatedProposalData, newLanguage);
      
      if (newPdfResult && typeof newPdfResult !== 'boolean') {
        // Update iframe with new PDF data URL - shows exact output
        iframe.src = (newPdfResult as jsPDF).output('datauristring');
      }
    };

    decreaseButton.onclick = async () => {
      currentLogoSize = Math.max(10, currentLogoSize - 5);
      logoSizeValue.textContent = `${currentLogoSize}%`;
      await updatePreview(currentLogoSize, languageSelector.value);
    };

    increaseButton.onclick = async () => {
      currentLogoSize = Math.min(100, currentLogoSize + 5);
      logoSizeValue.textContent = `${currentLogoSize}%`;
      await updatePreview(currentLogoSize, languageSelector.value);
    };
    
    // Add event listener to language selector - regenerates identical PDF
    languageSelector.addEventListener("change", async () => {
      await updatePreview(currentLogoSize, languageSelector.value);
    });
    
    // Add elements to the modal
    modalOverlay.appendChild(controls);
    modalOverlay.appendChild(iframe);
    
    // Add modal to the document
    document.body.appendChild(modalOverlay);
    
    return true;
  } catch (error) {
    console.error("PDF preview error:", error);
    return false;
  }
};

// Helper function to get company information - can be replaced with API call or settings
export const getCompanyInfo = () => {
  // Get stored company info from localStorage if available
  const storedCompanyInfo = localStorage.getItem("companyInfo");
  if (storedCompanyInfo) {
    return JSON.parse(storedCompanyInfo);
  }
  
  // Default company info
  return {
    logo: "https://placehold.co/200x60?text=Your+Logo",
    name: "AB MEDIA TEAM LTD",
    contactPerson: "Andreas Berger",
    street: "Weseler Str.73",
    postal: "47169",
    city: "Duisburg",
    country: "Germany",
    phone: "+49 203 70 90 72 62",
    fax: "+49 203 70 90 73 53",
    email: "kontakt.abmedia@gmail.com",
    website: "www.abmedia-team.com",
    registrationNumber: "15748871",
    vatId: "DE123418679",
    taxNumber: "13426 27369",
    director: "Andreas Berger",
    wise: true,
    accountNumber: "12345678901234567",
    accountHolder: "YOUR NAME",
    paymentMethod: "CREDIT CARD",
    bankCode: "967",
    iban: "BE79967023897833",
    bic: "TRWIBEB1"
  };
};

export const saveCompanyInfo = (companyInfo: any) => {
  localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
};

export const downloadProposal = (proposalData: any) => {
  // Create a simple PDF-like content
  const content = `
PROPOSAL ${proposalData.number}
Customer: ${proposalData.customer}
Subject: ${proposalData.subject}
Date: ${proposalData.date || new Date().toLocaleDateString()}

Address:
${proposalData.address || 'N/A'}
${proposalData.country || 'N/A'}

Content:
${proposalData.content || 'N/A'}

Line Items:
${proposalData.lineItems.map((item: any) => 
  `${item.name} - ${item.description || 'No description'} - Qty: ${item.quantity} - Price: €${item.unit_price?.toFixed(2) || '0.00'} - Amount: €${item.total_price?.toFixed(2) || '0.00'}`
).join('\n')}

Total Amount: €${proposalData.totalAmount?.toFixed(2) || '0.00'}
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proposal_${proposalData.number}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const loadInventoryItems = () => {
  const savedInventory = localStorage.getItem("inventoryItems");
  if (savedInventory) {
    return JSON.parse(savedInventory);
  }
  
  // Check alternative storage keys
  const savedInventoryItems = localStorage.getItem("inventory");
  if (savedInventoryItems) {
    return JSON.parse(savedInventoryItems);
  }
  
  return [];
};

export const getProposalStatusColor = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-yellow-100 text-yellow-800";
    case "Sent":
      return "bg-blue-100 text-blue-800";
    case "Accepted":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Expired":
      return "bg-gray-100 text-gray-800";
    case "Revised":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
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

export const formatInventoryItemForProposal = (item: InventoryItem, quantity: number = 1): ProposalLineItem => {
  const unitPrice = parseFloat(item.price.replace('EUR', '')) || 0;
  return {
    id: crypto.randomUUID(),
    proposal_id: "",
    item_id: item.id,
    name: item.name,
    description: item.description || "",
    quantity: quantity,
    unit_price: unitPrice,
    total_price: unitPrice * quantity,
    category: item.category,
    unit: item.unit || "unit",
    created_at: new Date().toISOString()
  };
};
