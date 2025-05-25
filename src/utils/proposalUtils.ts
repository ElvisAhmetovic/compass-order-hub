
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
    customerRef: "Customer Ref.",
    address: "Address",
    content: "Content",
    pos: "Pos.",
    description: "Description",
    quantity: "Quantity",
    unitPrice: "Unit Price",
    totalPrice: "Total Price",
    netAmount: "Net amount",
    vat: "VAT",
    grossAmount: "Gross amount",
    paymentTerms: "By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice.",
    placeDate: "Place / Date",
    signature: "Signature / Stamp"
  },
  de: {
    proposal: "Angebot",
    date: "Datum",
    customer: "Kunde",
    customerRef: "Kunden-Ref.",
    address: "Adresse",
    content: "Inhalt",
    pos: "Pos.",
    description: "Beschreibung",
    quantity: "Menge",
    unitPrice: "Preis pro Einheit",
    totalPrice: "Gesamtpreis",
    netAmount: "Nettobetrag",
    vat: "MwSt",
    grossAmount: "Bruttobetrag",
    paymentTerms: "Mit der Bestellung erklären Sie sich damit einverstanden, die in diesem Angebot enthaltenen Leistungen innerhalb von 7 Tagen nach Erhalt der Rechnung zu bezahlen.",
    placeDate: "Ort / Datum",
    signature: "Unterschrift / Stempel"
  },
  es: {
    proposal: "Oferta",
    date: "Fecha",
    customer: "Cliente",
    customerRef: "Su n° de cliente",
    address: "Dirección",
    content: "Contenido",
    pos: "Pos.",
    description: "Descripción",
    quantity: "Cantidad",
    unitPrice: "Precio unit.",
    totalPrice: "Precio total",
    netAmount: "Cantidad neta",
    vat: "IVA",
    grossAmount: "Cantidad bruto",
    paymentTerms: "Al realizar su pedido, acepta pagar los servicios incluidos en esta oferta en un plazo de 7 días a partir de la recepción de la factura.",
    placeDate: "Lugar / Fecha",
    signature: "Firma / Sello"
  }
};

// Function to generate a PDF from a proposal
export const generateProposalPDF = async (
  proposalData: any, 
  language: string = "en", 
  customFilename?: string
): Promise<jsPDF | boolean> => {
  // Create a temporary div to render the proposal
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  tempDiv.style.width = "210mm"; // A4 width
  
  // Get translation based on language
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();

  // Calculate logo width based on logoSize (if provided)
  const logoWidth = proposalData.logoSize ? `${proposalData.logoSize}%` : '33%';

  // Check if VAT is enabled
  const isVatEnabled = proposalData.vatEnabled !== false; // Default to true if not specified

  // Calculate totals based on current VAT setting
  const netAmount = proposalData.netAmount || 0;
  const vatRate = proposalData.vatRate || 19;
  const vatAmount = isVatEnabled ? (netAmount * vatRate / 100) : 0;
  const totalAmount = netAmount + vatAmount;

  // HTML structure for the PDF - matching the screenshot design
  tempDiv.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 210mm; background: white;">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <div style="flex: 1; max-width: 60%;">
          <div style="font-size: 11px; color: #666; margin-bottom: 25px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            ${companyInfo.name} · ${companyInfo.street} · ${companyInfo.postal} ${companyInfo.city}
          </div>
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Destinatario diritto a</div>
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
              ${proposalData.customer || ''}
            </div>
            <div style="font-size: 12px; color: #333; line-height: 1.4;">
              ${proposalData.address ? proposalData.address.split('\n').join('<br/>') : ''}
              ${proposalData.country ? '<br/>' + proposalData.country : ''}
            </div>
          </div>
        </div>
        
        <div style="text-align: right; flex-shrink: 0;">
          <img src="${proposalData.logo || companyInfo.logo}" style="max-height: 80px; max-width: ${logoWidth}; margin-bottom: 20px;" onerror="this.src='https://placehold.co/200x60?text=Your+Logo'; this.onerror=null;" />
          
          <table style="margin-left: auto; font-size: 12px;">
            <tr>
              <td style="padding: 3px 15px 3px 0; font-weight: bold; text-align: left;">${t.proposal} n°</td>
              <td style="padding: 3px 0; text-align: right;">${proposalData.number || ''}</td>
            </tr>
            <tr>
              <td style="padding: 3px 15px 3px 0; font-weight: bold; text-align: left;">${t.date}</td>
              <td style="padding: 3px 0; text-align: right;">${new Date(proposalData.date || Date.now()).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 3px 15px 3px 0; font-weight: bold; text-align: left;">${t.customerRef}</td>
              <td style="padding: 3px 0; text-align: right;">${proposalData.reference || '-'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Proposal Title -->
      <h2 style="color: #2563eb; margin-bottom: 20px; font-size: 18px; font-weight: bold;">
        ${t.proposal} ${proposalData.number || ''}
      </h2>

      <!-- Content Section -->
      <div style="margin-bottom: 25px; font-size: 12px; line-height: 1.5; color: #333;">
        ${proposalData.content ? proposalData.content.split('\n').join('<br/>') : ''}
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px;">
        <thead>
          <tr style="background-color: #4a90c2; color: white;">
            <th style="padding: 10px 8px; text-align: left; font-weight: bold; border: 1px solid #4a90c2;">${t.pos}</th>
            <th style="padding: 10px 8px; text-align: left; font-weight: bold; border: 1px solid #4a90c2;">${t.description}</th>
            <th style="padding: 10px 8px; text-align: center; font-weight: bold; border: 1px solid #4a90c2;">${t.quantity}</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: bold; border: 1px solid #4a90c2;">${t.unitPrice}</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: bold; border: 1px solid #4a90c2;">${t.totalPrice}</th>
          </tr>
        </thead>
        <tbody>
          ${(proposalData.lineItems || []).map((item: any, index: number) => `
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 12px 8px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold;">
                ${index + 1}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #e0e0e0;">
                <div style="font-weight: bold; margin-bottom: 4px;">${item.name || ''}</div>
                <div style="color: #666; font-size: 10px; line-height: 1.3;">
                  ${item.description ? item.description.split('\n').join('<br/>') : ''}
                </div>
              </td>
              <td style="padding: 12px 8px; border: 1px solid #e0e0e0; text-align: center;">
                ${item.quantity || 0} ${item.unit || 'piece'}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #e0e0e0; text-align: right;">
                ${(item.unit_price || 0).toFixed(2)} EUR
              </td>
              <td style="padding: 12px 8px; border: 1px solid #e0e0e0; text-align: right; font-weight: bold;">
                ${(item.total_price || 0).toFixed(2)} EUR
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <table style="width: 250px; font-size: 12px;">
          <tr>
            <td style="padding: 6px 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">
              ${t.netAmount}
            </td>
            <td style="padding: 6px 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">
              ${netAmount.toFixed(2)} EUR
            </td>
          </tr>
          ${isVatEnabled ? `
          <tr>
            <td style="padding: 6px 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">
              ${t.vat} ${vatRate}%
            </td>
            <td style="padding: 6px 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">
              ${vatAmount.toFixed(2)} EUR
            </td>
          </tr>
          ` : ''}
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 8px 12px; text-align: left; font-weight: bold; border: 2px solid #333;">
              ${t.grossAmount}
            </td>
            <td style="padding: 8px 12px; text-align: right; font-weight: bold; border: 2px solid #333;">
              ${totalAmount.toFixed(2)} EUR
            </td>
          </tr>
        </table>
      </div>

      <!-- Payment Terms -->
      <div style="margin-bottom: 40px; font-size: 11px; line-height: 1.4; color: #555;">
        ${t.paymentTerms}
      </div>
      
      <!-- Signature Section -->
      <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="width: 45%;">
          <div style="border-top: 1px solid #333; padding-top: 8px;">
            <div style="font-size: 10px; color: #666;">${t.placeDate}</div>
          </div>
        </div>
        <div style="width: 45%;">
          <div style="border-top: 1px solid #333; padding-top: 8px;">
            <div style="font-size: 10px; color: #666;">${t.signature}</div>
            ${proposalData.signatureUrl ? `<img src="${proposalData.signatureUrl}" style="max-height: 40px; margin-top: 8px;" />` : ''}
          </div>
        </div>
      </div>

      <!-- Footer Company Info -->
      <div style="margin-top: 60px; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
        <div style="display: flex; justify-content: space-between;">
          <div style="width: 22%;">
            <strong>${companyInfo.name}</strong><br/>
            ${companyInfo.contactPerson}<br/>
            ${companyInfo.street}<br/>
            ${companyInfo.postal} ${companyInfo.city}<br/>
            ${companyInfo.country}
          </div>
          <div style="width: 22%;">
            Tel: ${companyInfo.phone}<br/>
            ${companyInfo.fax ? 'Fax: ' + companyInfo.fax + '<br/>' : ''}
            E-Mail: ${companyInfo.email}<br/>
            Web: ${companyInfo.website}
          </div>
          <div style="width: 22%;">
            ${companyInfo.registrationNumber ? 'Reg. Merc.: ' + companyInfo.registrationNumber + '<br/>' : ''}
            ${companyInfo.vatId ? 'IVA: ' + companyInfo.vatId + '<br/>' : ''}
            ${companyInfo.taxNumber ? 'Tax: ' + companyInfo.taxNumber + '<br/>' : ''}
            ${companyInfo.director ? 'Dir.: ' + companyInfo.director + '<br/>' : ''}
          </div>
          <div style="width: 22%;">
            ${companyInfo.wise ? 'WISE<br/>' : ''}
            ${companyInfo.accountNumber ? 'Account: ' + companyInfo.accountNumber + '<br/>' : ''}
            ${companyInfo.bankCode ? 'Bank: ' + companyInfo.bankCode + '<br/>' : ''}
            ${companyInfo.iban ? 'IBAN: ' + companyInfo.iban + '<br/>' : ''}
            ${companyInfo.bic ? 'BIC: ' + companyInfo.bic : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(tempDiv);
  
  try {
    // Convert the HTML to PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5, // Higher scale for better quality
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
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
  } finally {
    document.body.removeChild(tempDiv);
  }
};

// New function to display PDF preview in a modal or dialog
export const previewProposalPDF = async (proposalData: any, language: string = "en") => {
  try {
    // Generate PDF in preview mode
    const pdfResult = await generateProposalPDF({...proposalData, previewMode: true}, language);
    
    // Check if the result is a jsPDF instance
    if (!pdfResult || typeof pdfResult === 'boolean') {
      console.error("Failed to generate PDF preview");
      return false;
    }
    
    // At this point, we know pdfResult is a jsPDF instance
    const pdf = pdfResult as jsPDF;
    
    // Convert the PDF to a data URL
    const dataUrl = pdf.output('datauristring');
    
    // Remove any existing PDF preview
    const existingOverlay = document.getElementById("pdf-preview-overlay");
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }
    
    // Create a modal to display the PDF
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
    
    // Create iframe to display the PDF
    const iframe = document.createElement("iframe");
    iframe.src = dataUrl;
    iframe.style.width = "80%";
    iframe.style.maxWidth = "1000px";
    iframe.style.height = "80%";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "white";
    iframe.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    iframe.style.borderRadius = "0 0 8px 8px";

    // Handler for logo size adjustment
    let currentLogoSize = proposalData.logoSize || 33;

    decreaseButton.onclick = async () => {
      currentLogoSize = Math.max(10, currentLogoSize - 5);
      logoSizeValue.textContent = `${currentLogoSize}%`;
      
      // Generate new preview with updated logo size
      const newPdfResult = await generateProposalPDF({
        ...proposalData, 
        previewMode: true,
        logoSize: currentLogoSize
      }, languageSelector.value);
      
      if (newPdfResult && typeof newPdfResult !== 'boolean') {
        iframe.src = (newPdfResult as jsPDF).output('datauristring');
      }
    };

    increaseButton.onclick = async () => {
      currentLogoSize = Math.min(100, currentLogoSize + 5);
      logoSizeValue.textContent = `${currentLogoSize}%`;
      
      // Generate new preview with updated logo size
      const newPdfResult = await generateProposalPDF({
        ...proposalData, 
        previewMode: true,
        logoSize: currentLogoSize
      }, languageSelector.value);
      
      if (newPdfResult && typeof newPdfResult !== 'boolean') {
        iframe.src = (newPdfResult as jsPDF).output('datauristring');
      }
    };
    
    // Add event listener to language selector
    languageSelector.addEventListener("change", async () => {
      const newLanguage = languageSelector.value;
      const newPdfResult = await generateProposalPDF({
        ...proposalData, 
        previewMode: true, 
        logoSize: currentLogoSize
      }, newLanguage);
      
      if (newPdfResult && typeof newPdfResult !== 'boolean') {
        // newPdfResult is a jsPDF instance
        const newPdf = newPdfResult as jsPDF;
        iframe.src = newPdf.output('datauristring');
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
    country: "Alemania",
    phone: "+49 203 70 90 72 62",
    fax: "+49 203 70 90 73 53",
    email: "kontakt.abmedia@gmail.com",
    website: "www.abmedia-team.com",
    registrationNumber: "15748871",
    vatId: "DE123418679",
    taxNumber: "13426 27369",
    director: "Andreas Berger",
    wise: true,
    accountNumber: "96702389783",
    bankCode: "967",
    iban: "BE79967023897833",
    bic: "TRWIBEB1"
  };
};

// Function to save company information
export const saveCompanyInfo = (companyInfo: any) => {
  localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
};

// Simple version for downloading as text - kept for backward compatibility
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

// Helper function to get status color class for proposals
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

// List of available proposal statuses
export const PROPOSAL_STATUSES = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
  "Revised"
];

// Function to format inventory item for proposal line item
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
