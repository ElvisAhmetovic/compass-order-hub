
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

// Updated PDF content to properly use all editable data
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
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 794px; min-height: 1123px; background: white; margin: 0; box-sizing: border-box; font-size: 11px;">
      
      <!-- Header Section with Company Info and Logo -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${companyInfo.name}</div>
          <div style="line-height: 1.4; color: #333;">
            ${companyInfo.street}<br/>
            ${companyInfo.postal} ${companyInfo.city}
          </div>
        </div>
        <div style="text-align: right;">
          <img src="${proposalData.logo || companyInfo.logo}" style="max-height: 80px; max-width: ${logoWidth};" onerror="this.src='https://placehold.co/200x60?text=Your+Logo'; this.onerror=null;" />
        </div>
      </div>

      <!-- Customer Information and Proposal Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1; padding-right: 40px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 15px;">${proposalData.customerName || proposalData.customer || 'Name Surname'}</div>
          <div style="line-height: 1.4; margin-bottom: 10px;">
            ${proposalData.customerAddress || 'Leidsestraat 15, 2000 Antwerpen'}<br/>
            ${proposalData.customerEmail || 'customer@email.com'}<br/>
            ${proposalData.customerCountry || 'Belgium'}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">Proposal no.</span>
            <span style="margin-left: 20px;">${proposalData.number || 'AN-9993'}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">${t.date}</span>
            <span style="margin-left: 20px;">${new Date(proposalData.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">${t.customerRef}</span>
            <span style="margin-left: 20px;">${proposalData.customerRef || proposalData.reference || ''}</span>
          </div>
          <div>
            <span style="font-weight: bold;">${t.yourContact}</span>
            <span style="margin-left: 20px;">${proposalData.yourContact || proposalData.internalContact || 'Thomas Klein'}</span>
          </div>
        </div>
      </div>

      <!-- Proposal Title -->
      <h2 style="color: #4a90e2; margin-bottom: 15px; font-size: 16px; font-weight: bold;">
        ${t.proposal} ${proposalData.number || 'AN-9993'}
      </h2>

      <!-- Proposal Content/Description -->
      <div style="margin-bottom: 25px; line-height: 1.5;">
        <strong>${proposalData.proposalTitle || proposalData.subject || 'Protect your online REPUTATION!'}</strong> 
        ${proposalData.proposalDescription || 'Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.'}
        ${proposalData.content ? `<br/><br/>${proposalData.content}` : ''}
      </div>

      <!-- Products/Services Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px;">
        <thead>
          <tr style="background-color: #4a5568; color: white;">
            <th style="padding: 12px 8px; text-align: left; font-weight: bold; border: none; width: 50%;">${t.productDescription}</th>
            <th style="padding: 12px 8px; text-align: center; font-weight: bold; border: none; width: 16%;">${t.price}</th>
            <th style="padding: 12px 8px; text-align: center; font-weight: bold; border: none; width: 14%;">${t.qty}</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: bold; border: none; width: 20%;">${t.total}</th>
          </tr>
        </thead>
        <tbody>
          ${(proposalData.lineItems || []).map((item: any, index: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
              <td style="padding: 15px 8px; border: none; vertical-align: top;">
                <div style="font-weight: bold; margin-bottom: 5px; color: #e67e22;">
                  ${item.name || 'Product/Service Name'}
                </div>
                ${item.description || item.additionalInfo ? `
                <div style="line-height: 1.4; color: #666; font-size: 9px; margin-top: 8px;">
                  ${item.description || item.additionalInfo || ''}
                </div>
                ` : ''}
              </td>
              <td style="padding: 15px 8px; border: none; text-align: center; vertical-align: top;">
                ${currencySymbol}${(item.unit_price || 0).toFixed(2)}
              </td>
              <td style="padding: 15px 8px; border: none; text-align: center; vertical-align: top;">
                ${item.quantity || 1}
              </td>
              <td style="padding: 15px 8px; border: none; text-align: right; vertical-align: top; font-weight: bold;">
                ${currencySymbol}${(item.total_price || 0).toFixed(2)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span>${t.subtotal}</span>
            <span>${currencySymbol}${netAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span>${t.vat} ${isVatEnabled ? `${vatRate}%` : '0%'}</span>
            <span>${currencySymbol}${vatAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 12px; background-color: #f8f9fa;">
            <span>${t.totalAmount}</span>
            <span>${currencySymbol}${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Payment Data Section -->
      <div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4a90e2;">
        <div style="font-weight: bold; margin-bottom: 8px;">${t.paymentData}</div>
        <div style="line-height: 1.4;">
          <div>${t.accountNr} ${paymentAccountNumber}</div>
          <div>${t.name} ${paymentAccountName}</div>
          <div>${t.paymentMethod} ${paymentMethodValue}</div>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div style="margin-bottom: 30px;">
        <div style="font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">${t.termsAndConditions}</div>
        <div style="line-height: 1.4; font-size: 10px;">
          ${proposalData.paymentTerms || proposalData.deliveryTerms || t.paymentTerms}
          ${proposalData.termsAndConditions ? `<br/><br/>${proposalData.termsAndConditions}` : ''}
        </div>
      </div>

      <!-- Footer Content -->
      ${proposalData.footerContent ? `
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
        <div style="line-height: 1.4; font-size: 10px;">
          ${proposalData.footerContent}
        </div>
      </div>
      ` : ''}

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="width: 45%;">
          <div style="border-top: 1px solid #333; padding-top: 8px;">
            <div style="font-size: 10px; color: #666;">${t.placeDate}</div>
          </div>
        </div>
        <div style="width: 45%;">
          <div style="border-top: 1px solid #333; padding-top: 8px;">
            <div style="font-size: 10px; color: #666;">${t.signatureStamp}</div>
            ${proposalData.signatureUrl ? `<img src="${proposalData.signatureUrl}" style="max-height: 40px; margin-top: 8px;" />` : ''}
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
