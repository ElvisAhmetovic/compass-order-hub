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
    vat: "VAT 0%",
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
    vat: "MwSt 0%",
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
    vat: "IVA 0%",
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

// Template using screenshot as background with positioned editable overlays
const createPDFContent = (proposalData: any, language: string = "en") => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();

  // Use the screenshot as base64 or a hosted image URL
  // For now using a placeholder - you'll need to replace this with the actual screenshot
  const templateImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="; // Replace with actual screenshot base64

  return `
    <div style="font-family: Arial, sans-serif; width: 794px; height: 1123px; background: white; margin: 0; padding: 0; position: relative; overflow: hidden;">
      
      <!-- Background Template Image -->
      <img src="${templateImageUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" onerror="this.style.display='none';" />
      
      <!-- Editable Text Overlays positioned based on screenshot -->
      <div style="position: absolute; z-index: 2; width: 100%; height: 100%;">
        
        <!-- Company Logo - Top Right -->
        <div style="position: absolute; top: 40px; right: 50px;">
          <img src="${proposalData.logo || companyInfo.logo}" style="max-height: 60px; max-width: 200px;" onerror="this.src='https://placehold.co/200x60?text=Your+Logo'; this.onerror=null;" />
        </div>
        
        <!-- Company Info - Top Left -->
        <div style="position: absolute; top: 40px; left: 50px; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: bold; margin-bottom: 5px;">${companyInfo.name}</div>
          <div>${companyInfo.street}</div>
          <div>${companyInfo.postal} ${companyInfo.city}</div>
          <div>${companyInfo.country || 'Germany'}</div>
        </div>
        
        <!-- Customer Info - Left Side -->
        <div style="position: absolute; top: 180px; left: 50px; font-size: 11px; line-height: 1.4;">
          <div style="font-weight: bold; margin-bottom: 10px;">${proposalData.customerName || 'Customer Name'}</div>
          <div>${proposalData.customerAddress || 'Customer Address'}</div>
          <div>${proposalData.customerEmail || 'customer@email.com'}</div>
          <div>${proposalData.customerCountry || 'Belgium'}</div>
        </div>
        
        <!-- Proposal Details - Right Side -->
        <div style="position: absolute; top: 180px; right: 50px; font-size: 11px; text-align: right;">
          <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">Proposal no.</span>
            <span style="margin-left: 20px;">${proposalData.number || 'AN-9993'}</span>
          </div>
          <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">${t.date}</span>
            <span style="margin-left: 20px;">${new Date(proposalData.date || Date.now()).toLocaleDateString()}</span>
          </div>
          <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">${t.customerRef}</span>
            <span style="margin-left: 20px;">${proposalData.customerRef || '7865'}</span>
          </div>
          <div>
            <span style="font-weight: bold;">${t.yourContact}</span>
            <span style="margin-left: 20px;">${proposalData.yourContact || 'Contact Person'}</span>
          </div>
        </div>
        
        <!-- Proposal Title -->
        <div style="position: absolute; top: 320px; left: 50px; font-size: 16px; font-weight: bold; color: #4a90e2;">
          ${t.proposal} ${proposalData.number || 'AN-9993'}
        </div>
        
        <!-- Proposal Description -->
        <div style="position: absolute; top: 360px; left: 50px; right: 50px; font-size: 11px; line-height: 1.5;">
          <strong>${proposalData.proposalTitle || 'Proposal Title'}</strong> ${proposalData.proposalDescription || 'Proposal description and details go here.'}
        </div>
        
        <!-- Service Items Table Area -->
        <div style="position: absolute; top: 420px; left: 50px; right: 50px; font-size: 10px;">
          <div style="background-color: #4a5568; color: white; padding: 8px; display: flex; font-weight: bold;">
            <div style="width: 50%;">${t.productDescription}</div>
            <div style="width: 16%; text-align: center;">${t.price}</div>
            <div style="width: 14%; text-align: center;">${t.qty}</div>
            <div style="width: 20%; text-align: right;">${t.total}</div>
          </div>
          
          ${(proposalData.lineItems || []).map((item: any, index: number) => `
            <div style="display: flex; padding: 12px 8px; border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
              <div style="width: 50%; padding-right: 10px;">
                <div style="font-weight: bold; color: #e67e22; margin-bottom: 5px;">
                  ${item.name || 'Service Name'} ${item.rating ? '★★★★★' : ''}
                </div>
                <div style="color: #666; font-size: 9px; line-height: 1.3;">
                  ${item.description || 'Service description goes here'}
                </div>
              </div>
              <div style="width: 16%; text-align: center; padding-top: 5px;">
                ${(item.unit_price || 399).toFixed(2)} EUR
              </div>
              <div style="width: 14%; text-align: center; padding-top: 5px;">
                ${item.quantity || 1}
              </div>
              <div style="width: 20%; text-align: right; font-weight: bold; padding-top: 5px;">
                ${(item.total_price || 399).toFixed(2)} EUR
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Totals Section -->
        <div style="position: absolute; top: 600px; right: 50px; width: 250px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e2e8f0;">
            <span>${t.subtotal}</span>
            <span>${(proposalData.netAmount || 0).toFixed(2)} EUR</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e2e8f0;">
            <span>${t.vat}</span>
            <span>0.00 EUR</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; background-color: #f8f9fa;">
            <span>${t.totalAmount}</span>
            <span>${(proposalData.netAmount || 0).toFixed(2)} EUR</span>
          </div>
        </div>
        
        <!-- Payment Information -->
        <div style="position: absolute; top: 720px; left: 50px; right: 50px; font-size: 10px; background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4a90e2;">
          <div style="font-weight: bold; margin-bottom: 8px;">${t.paymentData}</div>
          <div style="line-height: 1.4;">
            <div>${t.accountNr} ${companyInfo.accountNumber || '12345678901234567'}</div>
            <div>${t.name} ${companyInfo.accountHolder || 'Account Holder Name'}</div>
            <div>${t.paymentMethod} ${companyInfo.paymentMethod || 'Bank Transfer'}</div>
          </div>
        </div>
        
        <!-- Terms and Conditions -->
        <div style="position: absolute; top: 820px; left: 50px; right: 50px; font-size: 10px;">
          <div style="font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">${t.termsAndConditions}</div>
          <div style="line-height: 1.4;">
            ${proposalData.termsAndConditions || t.paymentTerms}
          </div>
        </div>
        
        <!-- Signature Lines -->
        <div style="position: absolute; bottom: 120px; left: 50px; right: 50px; display: flex; justify-content: space-between;">
          <div style="width: 45%; border-top: 1px solid #333; padding-top: 8px;">
            <div style="font-size: 10px; color: #666;">${t.placeDate}</div>
          </div>
          <div style="width: 45%; border-top: 1px solid #333; padding-top: 8px;">
            <div style="font-size: 10px; color: #666;">${t.signatureStamp}</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; font-size: 8px; color: white; background-color: #e74c3c; padding: 8px; display: flex; justify-content: space-between;">
          <div>
            <span style="margin-right: 15px;">Tel.: ${companyInfo.phone || '+49 203 70 90 72 62'}</span>
            <span style="margin-right: 15px;">Email: ${companyInfo.email || 'contact@company.com'}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold;">${companyInfo.name}</div>
            <div>${companyInfo.street}, ${companyInfo.postal} ${companyInfo.city}</div>
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

// Main function to generate a PDF from a proposal - now centralized
export const generateProposalPDF = async (
  proposalData: any, 
  language: string = "en", 
  customFilename?: string
): Promise<jsPDF | boolean> => {
  try {
    // Generate HTML content using centralized function
    const htmlContent = createPDFContent(proposalData, language);
    
    // Generate PDF using centralized function
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
    
    // Create left side controls div
    const leftControls = document.createElement("div");
    leftControls.style.display = "flex";
    leftControls.style.alignItems = "center";
    leftControls.appendChild(document.createTextNode("Language: "));
    leftControls.appendChild(languageSelector);
    
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
      await generateProposalPDF(proposalData, languageSelector.value);
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

    // Add event listener to language selector - regenerates identical PDF
    languageSelector.addEventListener("change", async () => {
      const updatedProposalData = {...proposalData, previewMode: true};
      const newPdfResult = await generateProposalPDF(updatedProposalData, languageSelector.value);
      
      if (newPdfResult && typeof newPdfResult !== 'boolean') {
        iframe.src = (newPdfResult as jsPDF).output('datauristring');
      }
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
