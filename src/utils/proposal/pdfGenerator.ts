
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getCompanyInfo } from "./companyInfo";
import { translations, SUPPORTED_LANGUAGES } from "../proposalTranslations";

// Get appropriate font family for each language
const getLanguageFont = (language: string) => {
  switch (language) {
    case 'ar':
      return "'Noto Sans Arabic', 'Arial Unicode MS', Arial, sans-serif";
    case 'zh':
      return "'Noto Sans SC', 'Microsoft YaHei', 'SimHei', sans-serif";
    case 'ja':
      return "'Noto Sans JP', 'Yu Gothic', 'Hiragino Sans', sans-serif";
    case 'ko':
      return "'Noto Sans KR', 'Malgun Gothic', 'Apple Gothic', sans-serif";
    case 'ru':
      return "'Noto Sans', 'Roboto', 'DejaVu Sans', Arial, sans-serif";
    case 'hi':
      return "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', sans-serif";
    case 'th':
      return "'Noto Sans Thai', 'Leelawadee UI', 'Tahoma', sans-serif";
    case 'vi':
      return "'Noto Sans Vietnamese', 'Segoe UI', 'Tahoma', sans-serif";
    case 'tr':
      return "'Noto Sans', 'Segoe UI', 'Roboto', Arial, sans-serif";
    case 'pt':
    case 'es':
    case 'fr':
    case 'it':
    case 'pl':
    case 'nl':
    case 'sv':
    case 'da':
    case 'no':
    case 'fi':
    case 'de':
    case 'en':
    default:
      return "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif";
  }
};

// Get text direction for languages that need RTL
const getTextDirection = (language: string) => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

// Create PDF content with proper styling
const createPDFContent = (proposalData: any, language: string = "en") => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();
  
  console.log('Creating PDF content with:', { proposalData, language, translations: t });
  
  // Get language-specific styling
  const fontFamily = getLanguageFont(language);
  const textDirection = getTextDirection(language);

  // Font sizes and spacing
  const baseFontSize = 14;
  const headerFontSize = 24;
  const titleFontSize = 20;
  const lineHeight = 1.5;
  const sectionSpacing = 20;
  const elementPadding = 15;

  // Calculate logo width
  const logoWidth = proposalData.logoSize ? `${proposalData.logoSize}%` : '33%';

  // VAT calculations
  const isVatEnabled = proposalData.vatEnabled === true;
  const netAmount = proposalData.netAmount || 0;
  const vatRate = proposalData.vatRate || 0;
  const vatAmount = isVatEnabled ? (netAmount * vatRate / 100) : 0;
  const totalAmount = isVatEnabled ? (netAmount + vatAmount) : netAmount;

  // Currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'EUR':
      default: return '€';
    }
  };

  const currencySymbol = getCurrencySymbol(proposalData.currency || 'EUR');

  // Payment data
  const paymentAccountNumber = proposalData.accountNumber || companyInfo.accountNumber || '12345678901234567';
  const paymentAccountName = proposalData.accountName || companyInfo.accountHolder || 'YOUR NAME';
  const paymentMethodValue = proposalData.paymentMethod || companyInfo.paymentMethod || 'CREDIT CARD';

  // Format date
  const proposalDate = proposalData.proposalDate ? 
    new Date(proposalData.proposalDate).toLocaleDateString() : 
    new Date(proposalData.created_at || Date.now()).toLocaleDateString();

  return `
    <style>
      * {
        box-sizing: border-box;
      }
      
      @page {
        size: A4;
        margin: 0;
      }
      
      body, html {
        margin: 0;
        padding: 0;
        background: white;
      }
      
      .pdf-container {
        width: 794px;
        min-height: 1123px;
        background: white;
        margin: 0;
        padding: 20px;
        font-family: ${fontFamily};
        font-size: ${baseFontSize}px;
        line-height: ${lineHeight};
        color: #2d3748;
        direction: ${textDirection};
      }
      
      .page-1 {
        min-height: 950px;
        max-height: 950px;
        overflow: hidden;
      }
      
      .page-2 {
        margin-top: 50px;
        min-height: 600px;
      }
      
      .keep-together {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      .section {
        margin-bottom: ${sectionSpacing}px;
      }
    </style>
    
    <div class="pdf-container">
      <!-- PAGE 1 CONTENT -->
      <div class="page-1">
        <!-- Header Section -->
        <div class="keep-together section" style="
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          padding-bottom: ${elementPadding}px; 
          border-bottom: 2px solid #e2e8f0;
        ">
          <div style="flex: 1; max-width: 62%;">
            <div style="
              font-weight: 600; 
              font-size: ${headerFontSize}px; 
              margin-bottom: 8px; 
              color: #1a202c;
            ">
              ${companyInfo.name || 'AB MEDIA TEAM LTD'}
            </div>
            <div style="line-height: ${lineHeight}; color: #4a5568;">
              <div>${companyInfo.street || 'Weseler Str.73'}</div>
              <div>${companyInfo.postal || '47169'} ${companyInfo.city || 'Duisburg'}</div>
              <div>${companyInfo.country || 'Germany'}</div>
            </div>
          </div>
          <div style="text-align: right;">
            ${proposalData.logo || companyInfo.logo ? `
            <div style="
              background: #f7fafc; 
              padding: 10px; 
              border-radius: 6px; 
              border: 1px solid #e2e8f0;
            ">
              <img src="${proposalData.logo || companyInfo.logo}" style="
                max-height: 50px; 
                max-width: ${logoWidth};
              " />
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Customer and Proposal Info -->
        <div class="keep-together section" style="
          display: flex; 
          justify-content: space-between; 
          gap: 20px;
        ">
          <div style="
            flex: 1; 
            background: #f8fafc; 
            padding: ${elementPadding}px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
          ">
            <div style="
              font-weight: 600; 
              margin-bottom: 10px; 
              color: #2d3748; 
              text-transform: uppercase;
            ">
              ${t.customerInformation || 'Customer Information'}
            </div>
            <div>
              <div style="font-weight: 600; margin-bottom: 6px;">
                ${proposalData.customerName || proposalData.customer || 'Name Surname'}
              </div>
              <div>${proposalData.customerAddress || 'Customer Address'}</div>
              <div>${proposalData.customerEmail || 'customer@email.com'}</div>
              <div>${proposalData.customerCountry || 'Country'}</div>
            </div>
          </div>
          
          <div style="flex: 0 0 auto; min-width: 250px;">
            <div style="
              background: #f8fafc; 
              padding: ${elementPadding}px; 
              border-radius: 6px; 
              border: 1px solid #e2e8f0;
            ">
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 500; color: #4a5568;">${t.proposalNumber || 'Proposal No.'}</span>
                <span style="float: right; font-weight: 600;">${proposalData.number || 'AN-9993'}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 500; color: #4a5568;">${t.proposalDate || 'Date'}</span>
                <span style="float: right;">${proposalDate}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 500; color: #4a5568;">${t.customerReference || 'Reference'}</span>
                <span style="float: right;">${proposalData.customerRef || proposalData.reference || '—'}</span>
              </div>
              <div>
                <span style="font-weight: 500; color: #4a5568;">${t.internalContactPerson || 'Contact'}</span>
                <span style="float: right;">${proposalData.yourContact || proposalData.internalContact || 'Thomas Klein'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Proposal Title -->
        <div class="keep-together section" style="
          background: #2d3748; 
          color: white; 
          padding: ${elementPadding}px; 
          border-radius: 6px;
        ">
          <h2 style="margin: 0; font-size: ${titleFontSize}px; font-weight: 600;">
            ${t.createNewProposal || 'Proposal'} ${proposalData.number || 'AN-9993'}
          </h2>
        </div>

        <!-- Proposal Content -->
        <div class="keep-together section" style="
          background: white; 
          padding: ${elementPadding}px; 
          border-radius: 6px; 
          border: 1px solid #e2e8f0;
        ">
          <div style="font-weight: 600; font-size: 18px; margin-bottom: 8px;">
            ${proposalData.proposalTitle || proposalData.subject || 'Proposal Title'}
          </div>
          <div>
            ${proposalData.proposalDescription || 'Thank you for your enquiry.'}
            ${proposalData.content ? `<br/><br/>${proposalData.content}` : ''}
          </div>
        </div>

        <!-- Line Items Table -->
        <div class="keep-together section" style="
          border-radius: 6px; 
          overflow: hidden; 
          border: 1px solid #e2e8f0;
        ">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #2d3748; color: white;">
                <th style="padding: 12px; text-align: left; width: 50%;">
                  ${t.productServiceName || t.description || 'Product/Service'}
                </th>
                <th style="padding: 12px; text-align: center; width: 16%;">
                  ${t.unitPrice || 'Price'}
                </th>
                <th style="padding: 12px; text-align: center; width: 14%;">
                  ${t.quantity || 'Qty'}
                </th>
                <th style="padding: 12px; text-align: right; width: 20%;">
                  ${t.total || 'Total'}
                </th>
              </tr>
            </thead>
            <tbody>
              ${(proposalData.lineItems || []).map((item: any, index: number) => `
                <tr style="
                  border-bottom: 1px solid #e2e8f0; 
                  background-color: ${index % 2 === 0 ? '#f8fafc' : 'white'};
                ">
                  <td style="padding: 12px; vertical-align: top;">
                    <div style="font-weight: 600; margin-bottom: 4px;">
                      ${item.name || 'Product/Service Name'}
                    </div>
                    ${item.description ? `
                    <div style="color: #718096; font-size: 12px;">
                      ${item.description}
                    </div>
                    ` : ''}
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    ${currencySymbol}${(item.unit_price || 0).toFixed(2)}
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    ${item.quantity || 1}
                  </td>
                  <td style="padding: 12px; text-align: right; font-weight: 600;">
                    ${currencySymbol}${(item.total_price || 0).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals Section -->
        <div class="keep-together section" style="display: flex; justify-content: flex-end;">
          <div style="
            width: 280px; 
            background: white; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
          ">
            <div style="
              background: #4a5568; 
              color: white; 
              padding: 10px 15px; 
              font-weight: 600;
            ">
              ${t.total || 'Summary'}
            </div>
            <div style="padding: 15px;">
              <div style="
                display: flex; 
                justify-content: space-between; 
                padding: 8px 0; 
                border-bottom: 1px solid #e2e8f0;
              ">
                <span>${t.netAmount || 'Subtotal'}</span>
                <span style="font-weight: 600;">${currencySymbol}${netAmount.toFixed(2)}</span>
              </div>
              <div style="
                display: flex; 
                justify-content: space-between; 
                padding: 8px 0; 
                border-bottom: 1px solid #e2e8f0;
              ">
                <span>${t.vatPricing || 'VAT'} ${isVatEnabled ? `${vatRate}%` : '0%'}</span>
                <span style="font-weight: 600;">${currencySymbol}${vatAmount.toFixed(2)}</span>
              </div>
              <div style="
                display: flex; 
                justify-content: space-between; 
                padding: 10px 0; 
                font-weight: 700; 
                background: #2d3748; 
                color: white; 
                margin: 10px -15px -15px -15px; 
                padding-left: 15px; 
                padding-right: 15px;
              ">
                <span>${t.totalAmount || 'Total Amount'}</span>
                <span>${currencySymbol}${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="keep-together section" style="
          background: white; 
          padding: ${elementPadding}px; 
          border-radius: 6px; 
          border: 1px solid #e2e8f0;
        ">
          <div style="
            font-weight: 600; 
            margin-bottom: 10px; 
            text-transform: uppercase; 
            color: #2d3748;
          ">
            ${t.termsConditions || 'Terms and Conditions'}
          </div>
          <div>
            ${proposalData.paymentTerms || proposalData.deliveryTerms || t.paymentTerms || 'Payment terms will be specified here.'}
            ${proposalData.termsAndConditions ? `<br/><br/>${proposalData.termsAndConditions}` : ''}
          </div>
        </div>

        <!-- Signature Section -->
        <div class="keep-together section" style="
          display: flex; 
          justify-content: space-between; 
          gap: 20px;
          min-height: 80px;
        ">
          <div style="
            width: 45%; 
            background: white; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
          ">
            <div style="border-top: 2px solid #2d3748; padding-top: 8px;">
              <div style="font-size: 12px; color: #718096; font-weight: 500;">Place & Date</div>
            </div>
          </div>
          <div style="
            width: 45%; 
            background: white; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
          ">
            <div style="border-top: 2px solid #2d3748; padding-top: 8px;">
              <div style="font-size: 12px; color: #718096; font-weight: 500;">Signature & Stamp</div>
              ${proposalData.signatureUrl ? `<img src="${proposalData.signatureUrl}" style="max-height: 30px; margin-top: 8px;" />` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- PAGE 2 CONTENT -->
      <div class="page-2">
        <!-- Payment Data Section -->
        <div class="keep-together section" style="
          background: #e6fffa; 
          padding: ${elementPadding}px; 
          border-radius: 6px; 
          border-left: 4px solid #38a169; 
          border: 1px solid #81e6d9;
        ">
          <div style="
            font-weight: 600; 
            margin-bottom: 12px; 
            color: #2d6b4f; 
            text-transform: uppercase;
          ">
            ${t.paymentData || 'Payment Data'}
          </div>
          <div style="color: #2d6b4f;">
            <div style="margin-bottom: 8px;">
              <strong>${t.accountNumber || 'Account Nr'}:</strong> ${paymentAccountNumber}
            </div>
            <div style="margin-bottom: 8px;">
              <strong>${t.accountName || 'Name'}:</strong> ${paymentAccountName}
            </div>
            <div>
              <strong>${t.paymentMethod || 'Payment Method'}:</strong> ${paymentMethodValue}
            </div>
          </div>
        </div>

        <!-- Footer Content -->
        ${proposalData.footerContent ? `
        <div class="keep-together section" style="
          padding: ${elementPadding}px; 
          background: #faf5ff; 
          border-radius: 6px; 
          border-left: 4px solid #805ad5;
        ">
          ${proposalData.footerContent}
        </div>
        ` : ''}

        <!-- Company Footer -->
        <div class="keep-together section" style="
          background: #2d3748; 
          border-radius: 6px; 
          color: white;
        ">
          <div style="
            background: rgba(255,255,255,0.1); 
            padding: 8px 15px; 
            text-align: center; 
            font-weight: 600;
          ">
            ${companyInfo.name || 'AB MEDIA TEAM LTD'}
          </div>
          
          <div style="padding: 12px 15px; font-size: 12px;">
            <div style="margin-bottom: 10px;">
              <div style="display: inline-block; width: 33%; vertical-align: top;">
                <div><strong>Tel:</strong> ${companyInfo.phone || '+49 203 70 90 72 62'}</div>
                <div><strong>Fax:</strong> ${companyInfo.fax || '+49 203 70 90 73 53'}</div>
              </div>
              <div style="display: inline-block; width: 33%; vertical-align: top;">
                <div><strong>Email:</strong> ${companyInfo.email || 'kontakt.abmedia@gmail.com'}</div>
                <div><strong>Web:</strong> ${companyInfo.website || 'www.abmedia-team.com'}</div>
              </div>
              <div style="display: inline-block; width: 33%; vertical-align: top; text-align: right;">
                <div style="font-weight: 500; margin-bottom: 3px;">
                  ${companyInfo.contactPerson || 'Andreas Berger'}
                </div>
                <div style="font-size: 11px;">
                  ${companyInfo.street || 'Weseler Str.73'}<br/>
                  ${companyInfo.postal || '47169'} ${companyInfo.city || 'Duisburg'}<br/>
                  ${companyInfo.country || 'Germany'}
                </div>
              </div>
            </div>
          </div>
          
          <div style="
            background: rgba(255,255,255,0.05); 
            padding: 8px 15px; 
            font-size: 11px; 
            color: #cbd5e0;
          ">
            <div style="display: inline-block; width: 70%;">
              REG: ${companyInfo.registrationNumber || '15748871'} | 
              VAT: ${companyInfo.vatId || 'DE123418679'} | 
              TAX: ${companyInfo.taxNumber || '13426 27369'}
            </div>
            <div style="display: inline-block; width: 30%; text-align: right;">
              Director: ${companyInfo.director || 'Andreas Berger'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Simplified PDF generation function
const generatePDFFromHTML = async (htmlContent: string): Promise<jsPDF> => {
  console.log('Starting PDF generation from HTML');
  
  // Create temporary div
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  tempDiv.style.width = "794px";
  tempDiv.style.backgroundColor = "white";
  
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);
  
  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    console.log('Converting HTML to canvas');
    
    // Convert to canvas with improved settings
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: Math.max(1600, tempDiv.scrollHeight)
    });
    
    console.log('Canvas created, generating PDF');
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Split into pages if needed
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
    
    console.log('PDF generation completed successfully');
    return pdf;
  } finally {
    document.body.removeChild(tempDiv);
  }
};

// Main PDF generation function
export const generateProposalPDF = async (
  proposalData: any, 
  language: string = "en", 
  customFilename?: string
): Promise<jsPDF | boolean> => {
  try {
    console.log('Generating PDF for proposal:', proposalData.number, 'Language:', language);
    
    // Generate HTML content
    const htmlContent = createPDFContent(proposalData, language);
    
    if (!htmlContent || htmlContent.trim() === '') {
      console.error('HTML content is empty');
      return false;
    }
    
    // Generate PDF
    const pdf = await generatePDFFromHTML(htmlContent);
    
    // For preview mode, return the PDF document
    if (proposalData.previewMode) {
      return pdf;
    }
    
    // For download mode, save the PDF
    const filename = customFilename || `proposal_${proposalData.number || 'draft'}.pdf`;
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("PDF generation error:", error);
    return false;
  }
};

// Preview function
export const previewProposalPDF = async (proposalData: any, language: string = "en") => {
  try {
    console.log('Generating PDF preview');
    
    // Generate PDF using the main function
    const pdfResult = await generateProposalPDF({...proposalData, previewMode: true}, language);
    
    if (!pdfResult || typeof pdfResult === 'boolean') {
      console.error("Failed to generate PDF preview");
      return false;
    }
    
    const pdf = pdfResult as jsPDF;
    const dataUrl = pdf.output('datauristring');
    
    // Remove existing preview
    const existingOverlay = document.getElementById("pdf-preview-overlay");
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }
    
    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.75);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;
    modalOverlay.id = "pdf-preview-overlay";
    
    // Create controls
    const controls = document.createElement("div");
    controls.style.cssText = `
      display: flex;
      justify-content: space-between;
      width: 80%;
      max-width: 1000px;
      padding: 10px;
      background-color: white;
      border-radius: 8px 8px 0 0;
    `;
    
    // Language selector
    const languageSelector = document.createElement("select");
    languageSelector.style.cssText = "padding: 8px; border-radius: 4px; margin-right: 8px;";
    
    SUPPORTED_LANGUAGES.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang.code;
      option.text = lang.name;
      option.selected = lang.code === language;
      languageSelector.appendChild(option);
    });
    
    // Logo size controls
    const logoSizeControls = document.createElement("div");
    logoSizeControls.style.cssText = "display: flex; align-items: center; margin-left: 16px;";
    
    const logoSizeLabel = document.createElement("span");
    logoSizeLabel.textContent = "Logo Size:";
    logoSizeLabel.style.marginRight = "8px";
    
    const decreaseButton = document.createElement("button");
    decreaseButton.textContent = "-";
    decreaseButton.style.cssText = "padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc; margin-right: 8px; cursor: pointer;";
    
    const logoSizeValue = document.createElement("span");
    logoSizeValue.textContent = `${proposalData.logoSize || 33}%`;
    logoSizeValue.style.cssText = "margin-right: 8px; min-width: 40px; text-align: center;";
    
    const increaseButton = document.createElement("button");
    increaseButton.textContent = "+";
    increaseButton.style.cssText = "padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc; cursor: pointer;";
    
    logoSizeControls.appendChild(logoSizeLabel);
    logoSizeControls.appendChild(decreaseButton);
    logoSizeControls.appendChild(logoSizeValue);
    logoSizeControls.appendChild(increaseButton);
    
    // Left controls
    const leftControls = document.createElement("div");
    leftControls.style.cssText = "display: flex; align-items: center;";
    leftControls.appendChild(document.createTextNode("Language: "));
    leftControls.appendChild(languageSelector);
    leftControls.appendChild(logoSizeControls);
    
    // Right controls
    const rightControls = document.createElement("div");
    
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Download PDF";
    downloadButton.style.cssText = "padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 8px;";
    downloadButton.onclick = async () => {
      await generateProposalPDF({...proposalData, logoSize: parseInt(logoSizeValue.textContent || '33')}, languageSelector.value);
    };
    
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.cssText = "padding: 8px 16px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;";
    closeButton.onclick = () => {
      document.body.removeChild(modalOverlay);
    };
    
    rightControls.appendChild(downloadButton);
    rightControls.appendChild(closeButton);
    
    controls.appendChild(leftControls);
    controls.appendChild(rightControls);
    
    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = dataUrl;
    iframe.style.cssText = `
      width: 80%;
      max-width: 1000px;
      height: 80%;
      border: none;
      background-color: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      border-radius: 0 0 8px 8px;
    `;

    // Update preview function
    let currentLogoSize = proposalData.logoSize || 33;

    const updatePreview = async (newLogoSize: number, newLanguage: string) => {
      const updatedProposalData = {
        ...proposalData, 
        previewMode: true,
        logoSize: newLogoSize
      };
      
      const newPdfResult = await generateProposalPDF(updatedProposalData, newLanguage);
      
      if (newPdfResult && typeof newPdfResult !== 'boolean') {
        iframe.src = (newPdfResult as jsPDF).output('datauristring');
      }
    };

    // Event handlers
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
    
    languageSelector.addEventListener("change", async () => {
      await updatePreview(currentLogoSize, languageSelector.value);
    });
    
    // Add to modal
    modalOverlay.appendChild(controls);
    modalOverlay.appendChild(iframe);
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    return true;
  } catch (error) {
    console.error("PDF preview error:", error);
    return false;
  }
};
