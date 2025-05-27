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

// Enhanced PDF content with professional typography and design
const createPDFContent = (proposalData: any, language: string = "en") => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();

  // Calculate logo width based on logoSize
  const logoWidth = proposalData.logoSize ? `${proposalData.logoSize}%` : '33%';

  // Proper VAT handling with all user data
  console.log('PDF Generation - All proposal data:', proposalData);
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

  console.log('PDF Generation - Using data:', {
    customerName: proposalData.customerName,
    customerAddress: proposalData.customerAddress,
    customerEmail: proposalData.customerEmail,
    customerCountry: proposalData.customerCountry,
    proposalTitle: proposalData.proposalTitle,
    proposalDescription: proposalData.proposalDescription,
    yourContact: proposalData.yourContact,
    lineItems: proposalData.lineItems,
    vatEnabled: isVatEnabled,
    netAmount,
    vatAmount,
    totalAmount,
    paymentData: {
      accountNumber: paymentAccountNumber,
      accountName: paymentAccountName,
      paymentMethod: paymentMethodValue
    }
  });

  return `
    <div style="font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif; padding: 30px; max-width: 794px; min-height: 1123px; background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%); margin: 0; box-sizing: border-box; font-size: 12px; line-height: 1.6; color: #1a1a1a;">
      
      <!-- Header Section with Enhanced Design -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; padding-bottom: 25px; border-bottom: 3px solid #e5e7eb; position: relative;">
        <div style="flex: 1; max-width: 60%;">
          <div style="font-weight: 700; font-size: 20px; margin-bottom: 12px; color: #1e40af; letter-spacing: -0.5px;">${companyInfo.name}</div>
          <div style="line-height: 1.8; color: #4b5563; font-size: 13px; font-weight: 400;">
            <div style="margin-bottom: 4px;">${companyInfo.street}</div>
            <div style="margin-bottom: 4px;">${companyInfo.postal} ${companyInfo.city}</div>
            <div style="color: #6b7280; font-size: 12px;">${companyInfo.country || 'Germany'}</div>
          </div>
        </div>
        <div style="text-align: right; position: relative;">
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 15px;">
            <img src="${proposalData.logo || companyInfo.logo}" style="max-height: 85px; max-width: ${logoWidth}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));" onerror="this.src='https://placehold.co/200x60?text=Your+Logo'; this.onerror=null;" />
          </div>
        </div>
      </div>

      <!-- Customer Information and Proposal Details with Enhanced Layout -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 45px; gap: 40px;">
        <div style="flex: 1; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 16px; border-left: 5px solid #0ea5e9; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="font-weight: 700; font-size: 16px; margin-bottom: 18px; color: #0c4a6e; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px; display: inline-block;">${t.customer}</div>
          <div style="line-height: 1.7; font-size: 13px;">
            <div style="font-weight: 600; margin-bottom: 12px; font-size: 15px; color: #1e40af;">${proposalData.customerName || proposalData.customer || 'Name Surname'}</div>
            <div style="margin-bottom: 8px; color: #374151;">${proposalData.customerAddress || 'Leidsestraat 15, 2000 Antwerpen'}</div>
            <div style="margin-bottom: 8px; color: #374151;">${proposalData.customerEmail || 'customer@email.com'}</div>
            <div style="color: #6b7280; font-weight: 500;">${proposalData.customerCountry || 'Belgium'}</div>
          </div>
        </div>
        
        <div style="flex: 0 0 auto; min-width: 280px;">
          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 25px; border-radius: 16px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #fbbf24;">
              <span style="font-weight: 600; color: #92400e;">Proposal no.</span>
              <span style="font-weight: 700; color: #1e40af; font-size: 14px;">${proposalData.number || 'AN-9993'}</span>
            </div>
            <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #fbbf24;">
              <span style="font-weight: 600; color: #92400e;">${t.date}</span>
              <span style="color: #374151; font-weight: 500;">${new Date(proposalData.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #fbbf24;">
              <span style="font-weight: 600; color: #92400e;">${t.customerRef}</span>
              <span style="color: #374151; font-weight: 500;">${proposalData.customerRef || proposalData.reference || '—'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #92400e;">${t.yourContact}</span>
              <span style="color: #374151; font-weight: 500;">${proposalData.yourContact || proposalData.internalContact || 'Thomas Klein'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Proposal Title -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 16px; margin-bottom: 35px; box-shadow: 0 8px 25px rgba(30, 64, 175, 0.15);">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          ${t.proposal} ${proposalData.number || 'AN-9993'}
        </h2>
      </div>

      <!-- Enhanced Proposal Content/Description -->
      <div style="margin-bottom: 35px; background: white; padding: 25px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e5e7eb;">
        <div style="line-height: 1.8; font-size: 13px;">
          <div style="font-weight: 700; font-size: 16px; color: #1e40af; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${proposalData.proposalTitle || proposalData.subject || 'Protect your online REPUTATION!'}
          </div>
          <div style="color: #374151; line-height: 1.7;">
            ${proposalData.proposalDescription || 'Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.'}
            ${proposalData.content ? `<br/><br/>${proposalData.content}` : ''}
          </div>
        </div>
      </div>

      <!-- Enhanced Products/Services Table -->
      <div style="margin-bottom: 40px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: white;">
          <thead>
            <tr style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white;">
              <th style="padding: 18px 20px; text-align: left; font-weight: 700; border: none; width: 50%; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.productDescription}</th>
              <th style="padding: 18px 20px; text-align: center; font-weight: 700; border: none; width: 16%; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.price}</th>
              <th style="padding: 18px 20px; text-align: center; font-weight: 700; border: none; width: 14%; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.qty}</th>
              <th style="padding: 18px 20px; text-align: right; font-weight: 700; border: none; width: 20%; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.total}</th>
            </tr>
          </thead>
          <tbody>
            ${(proposalData.lineItems || []).map((item: any, index: number) => `
              <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${index % 2 === 0 ? '#fafbfc' : 'white'}; transition: background-color 0.2s;">
                <td style="padding: 20px; border: none; vertical-align: top;">
                  <div style="font-weight: 700; margin-bottom: 8px; color: #1e40af; font-size: 14px; line-height: 1.4;">
                    ${item.name || 'Product/Service Name'}
                  </div>
                  ${item.description || item.additionalInfo ? `
                  <div style="line-height: 1.6; color: #6b7280; font-size: 11px; margin-top: 8px; font-style: italic;">
                    ${item.description || item.additionalInfo || ''}
                  </div>
                  ` : ''}
                </td>
                <td style="padding: 20px; border: none; text-align: center; vertical-align: top; font-weight: 600; color: #374151;">
                  <span style="background: #f0f9ff; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                    ${currencySymbol}${(item.unit_price || 0).toFixed(2)}
                  </span>
                </td>
                <td style="padding: 20px; border: none; text-align: center; vertical-align: top; font-weight: 600; color: #374151;">
                  <span style="background: #f0fdf4; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                    ${item.quantity || 1}
                  </span>
                </td>
                <td style="padding: 20px; border: none; text-align: right; vertical-align: top; font-weight: 700; font-size: 14px; color: #1e40af;">
                  ${currencySymbol}${(item.total_price || 0).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Enhanced Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 350px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #475569 0%, #64748b 100%); color: white; padding: 15px 25px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 13px;">
            Summary
          </div>
          <div style="padding: 20px 25px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
              <span style="color: #64748b; font-weight: 500;">${t.subtotal}</span>
              <span style="font-weight: 600; color: #1e293b;">${currencySymbol}${netAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 2px solid #e2e8f0; font-size: 13px;">
              <span style="color: #64748b; font-weight: 500;">${t.vat} ${isVatEnabled ? `${vatRate}%` : '0%'}</span>
              <span style="font-weight: 600; color: #1e293b;">${currencySymbol}${vatAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 18px 0; font-weight: 700; font-size: 16px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; margin: 15px -25px -20px -25px; padding-left: 25px; padding-right: 25px;">
              <span>${t.totalAmount}</span>
              <span>${currencySymbol}${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Payment Data Section -->
      <div style="margin-bottom: 30px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 16px; border-left: 5px solid #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="font-weight: 700; margin-bottom: 15px; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">💳</span>
          ${t.paymentData}
        </div>
        <div style="line-height: 1.8; font-size: 13px; color: #047857;">
          <div style="margin-bottom: 8px;"><strong>${t.accountNr}</strong> ${paymentAccountNumber}</div>
          <div style="margin-bottom: 8px;"><strong>${t.name}</strong> ${paymentAccountName}</div>
          <div><strong>${t.paymentMethod}</strong> ${paymentMethodValue}</div>
        </div>
      </div>

      <!-- Enhanced Terms and Conditions -->
      <div style="margin-bottom: 40px; background: white; padding: 25px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e5e7eb;">
        <div style="font-weight: 700; margin-bottom: 15px; text-transform: uppercase; color: #1e40af; font-size: 14px; letter-spacing: 0.5px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; display: inline-block;">
          ${t.termsAndConditions}
        </div>
        <div style="line-height: 1.7; font-size: 12px; color: #4b5563;">
          ${proposalData.paymentTerms || proposalData.deliveryTerms || t.paymentTerms}
          ${proposalData.termsAndConditions ? `<br/><br/>${proposalData.termsAndConditions}` : ''}
        </div>
      </div>

      <!-- Enhanced Footer Content -->
      ${proposalData.footerContent ? `
      <div style="margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #fef7ff 0%, #fae8ff 100%); border-radius: 16px; border-left: 5px solid #a855f7; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="line-height: 1.7; font-size: 12px; color: #581c87;">
          ${proposalData.footerContent}
        </div>
      </div>
      ` : ''}

      <!-- Enhanced Signature Section -->
      <div style="display: flex; justify-content: space-between; margin-top: 60px; gap: 40px;">
        <div style="width: 45%; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e5e7eb;">
          <div style="border-top: 2px solid #1e40af; padding-top: 12px;">
            <div style="font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${t.placeDate}</div>
          </div>
        </div>
        <div style="width: 45%; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e5e7eb;">
          <div style="border-top: 2px solid #1e40af; padding-top: 12px;">
            <div style="font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${t.signatureStamp}</div>
            ${proposalData.signatureUrl ? `<img src="${proposalData.signatureUrl}" style="max-height: 50px; margin-top: 12px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));" />` : ''}
          </div>
        </div>
      </div>

      <!-- Footer Company Info - Enhanced Professional Design -->
      <div style="position: absolute; bottom: 15px; left: 15px; right: 15px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <!-- Header section with company name -->
        <div style="background: rgba(255,255,255,0.1); padding: 8px 20px; border-bottom: 1px solid rgba(255,255,255,0.2);">
          <div style="color: white; font-weight: bold; font-size: 11px; text-align: center;">
            ${companyInfo.name}
          </div>
        </div>
        
        <!-- Main content area -->
        <div style="padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; color: white; font-size: 9px;">
          
          <!-- Contact Information -->
          <div style="flex: 1; margin-right: 20px;">
            <div style="margin-bottom: 6px; display: flex; align-items: center;">
              <span style="font-weight: 600; margin-right: 8px; color: #e0e7ff;">📞</span>
              <span>Tel: ${companyInfo.phone || '+49 203 70 90 72 62'}</span>
            </div>
            <div style="margin-bottom: 6px; display: flex; align-items: center;">
              <span style="font-weight: 600; margin-right: 8px; color: #e0e7ff;">📠</span>
              <span>Fax: ${companyInfo.fax || '+49 203 70 90 73 53'}</span>
            </div>
          </div>
          
          <!-- Digital Contact -->
          <div style="flex: 1; margin-right: 20px;">
            <div style="margin-bottom: 6px; display: flex; align-items: center;">
              <span style="font-weight: 600; margin-right: 8px; color: #e0e7ff;">✉️</span>
              <span>Email: ${companyInfo.email || 'kontakt.abmedia@gmail.com'}</span>
            </div>
            <div style="margin-bottom: 6px; display: flex; align-items: center;">
              <span style="font-weight: 600; margin-right: 8px; color: #e0e7ff;">🌐</span>
              <span>Web: ${companyInfo.website || 'www.abmedia-team.com'}</span>
            </div>
          </div>
          
          <!-- Company Address -->
          <div style="flex: 1; text-align: right; padding-left: 20px; border-left: 1px solid rgba(255,255,255,0.2);">
            <div style="font-weight: 600; margin-bottom: 4px; color: #e0e7ff;">
              ${companyInfo.contactPerson || 'Andreas Berger'}
            </div>
            <div style="line-height: 1.3;">
              ${companyInfo.street}<br/>
              ${companyInfo.postal} ${companyInfo.city}<br/>
              ${companyInfo.country || 'Germany'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Improved PDF generation with consistent canvas settings
const generatePDFFromHTML = async (htmlContent: string): Promise<jsPDF> => {
  // Create a temporary div to render the proposal with fixed dimensions
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  tempDiv.style.width = "794px"; // A4 width in pixels at 96 DPI
  tempDiv.style.height = "1123px"; // A4 height in pixels at 96 DPI
  tempDiv.style.backgroundColor = "white";
  tempDiv.style.overflow = "hidden";
  
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);
  
  try {
    // Convert the HTML to canvas with consistent settings
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5, // Consistent scale for both preview and PDF
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    return pdf;
  } finally {
    document.body.removeChild(tempDiv);
  }
};

// Main function to generate a PDF from a proposal - now properly handles all user data
export const generateProposalPDF = async (
  proposalData: any, 
  language: string = "en", 
  customFilename?: string
): Promise<jsPDF | boolean> => {
  try {
    console.log('Generating PDF with data:', proposalData);
    
    // Generate HTML content using all editable fields
    const htmlContent = createPDFContent(proposalData, language);
    
    // Generate PDF
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
