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

// Create first page content - ALWAYS includes header, customer info, proposal content, line items, and signature
const createFirstPageContent = (proposalData: any, language: string = "en") => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();
  
  // Get language-specific styling
  const fontFamily = getLanguageFont(language);
  const textDirection = getTextDirection(language);

  // Calculate logo width
  const logoWidth = proposalData.logoSize ? `${proposalData.logoSize}%` : '33%';

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

  return `
    <style>
      * {
        box-sizing: border-box;
      }
      
      body, html {
        margin: 0;
        padding: 0;
        background: white;
      }
      
      .pdf-page {
        width: 794px;
        height: 1100px;
        background: white;
        margin: 0;
        padding: 20px;
        font-family: ${fontFamily};
        font-size: 14px;
        line-height: 1.4;
        color: #2d3748;
        direction: ${textDirection};
        overflow: hidden;
      }
      
      .section {
        margin-bottom: 16px;
      }
    </style>
    
    <div class="pdf-page">
      <!-- Header Section -->
      <div class="section" style="
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start; 
        padding-bottom: 12px; 
        border-bottom: 2px solid #e2e8f0;
      ">
        <div style="flex: 1; max-width: 62%;">
          <div style="
            font-weight: 600; 
            font-size: 22px; 
            margin-bottom: 6px; 
            color: #1a202c;
          ">
            ${companyInfo.name || 'AB MEDIA TEAM LTD'}
          </div>
          <div style="line-height: 1.4; color: #4a5568; font-size: 13px;">
            <div>${companyInfo.street || 'Weseler Str.73'}</div>
            <div>${companyInfo.postal || '47169'} ${companyInfo.city || 'Duisburg'}</div>
            <div>${companyInfo.country || 'Germany'}</div>
          </div>
        </div>
        <div style="text-align: right;">
          ${proposalData.logo || companyInfo.logo ? `
          <div style="
            background: #f7fafc; 
            padding: 8px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
          ">
            <img src="${proposalData.logo || companyInfo.logo}" style="
              max-height: 45px; 
              max-width: ${logoWidth};
            " />
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Customer and Proposal Info -->
      <div class="section" style="
        display: flex; 
        justify-content: space-between; 
        gap: 16px;
      ">
        <div style="
          flex: 1; 
          background: #f8fafc; 
          padding: 12px; 
          border-radius: 6px; 
          border: 1px solid #e2e8f0;
          font-size: 13px;
        ">
          <div style="
            font-weight: 600; 
            margin-bottom: 8px; 
            color: #2d3748; 
            text-transform: uppercase;
            font-size: 12px;
          ">
            ${t.customerInformation || 'Customer Information'}
          </div>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">
              ${proposalData.customerName || proposalData.customer || 'Name Surname'}
            </div>
            <div>${proposalData.customerAddress || 'Customer Address'}</div>
            <div>${proposalData.customerEmail || 'customer@email.com'}</div>
            <div>${proposalData.customerCountry || 'Country'}</div>
          </div>
        </div>
        
        <div style="flex: 0 0 auto; min-width: 240px;">
          <div style="
            background: #f8fafc; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
            font-size: 13px;
          ">
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 500; color: #4a5568;">${t.proposalNumber || 'Proposal No.'}</span>
              <span style="float: right; font-weight: 600;">${proposalData.number || 'AN-9993'}</span>
            </div>
            <div style="margin-bottom: 6px;">
              <span style="font-weight: 500; color: #4a5568;">${t.proposalDate || 'Date'}</span>
              <span style="float: right;">${proposalData.proposalDate ? new Date(proposalData.proposalDate).toLocaleDateString() : new Date(proposalData.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style="margin-bottom: 6px;">
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
      <div class="section" style="
        background: #2d3748; 
        color: white; 
        padding: 12px; 
        border-radius: 6px;
      ">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600;">
          ${t.createNewProposal || 'Proposal'} ${proposalData.number || 'AN-9993'}
        </h2>
      </div>

      <!-- Proposal Content -->
      <div class="section" style="
        background: white; 
        padding: 12px; 
        border-radius: 6px; 
        border: 1px solid #e2e8f0;
        font-size: 13px;
      ">
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 6px;">
          ${proposalData.proposalTitle || proposalData.subject || 'Proposal Title'}
        </div>
        <div>
          ${proposalData.proposalDescription || 'Thank you for your enquiry.'}
          ${proposalData.content ? `<br/><br/>${proposalData.content}` : ''}
        </div>
      </div>

      <!-- Line Items Table -->
      <div class="section" style="
        border-radius: 6px; 
        overflow: hidden; 
        border: 1px solid #e2e8f0;
      ">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #2d3748; color: white;">
              <th style="padding: 10px; text-align: left; width: 50%;">
                ${t.productServiceName || t.description || 'Product/Service'}
              </th>
              <th style="padding: 10px; text-align: center; width: 16%;">
                ${t.unitPrice || 'Price'}
              </th>
              <th style="padding: 10px; text-align: center; width: 14%;">
                ${t.quantity || 'Qty'}
              </th>
              <th style="padding: 10px; text-align: right; width: 20%;">
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
                <td style="padding: 10px; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 3px;">
                    ${item.name || 'Product/Service Name'}
                  </div>
                  ${item.description ? `
                  <div style="color: #718096; font-size: 11px;">
                    ${item.description}
                  </div>
                  ` : ''}
                </td>
                <td style="padding: 10px; text-align: center;">
                  ${currencySymbol}${(item.unit_price || 0).toFixed(2)}
                </td>
                <td style="padding: 10px; text-align: center;">
                  ${item.quantity || 1}
                </td>
                <td style="padding: 10px; text-align: right; font-weight: 600;">
                  ${currencySymbol}${(item.total_price || 0).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div class="section" style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="flex: 1;">
          <!-- Signature Section - Now on first page -->
          <div style="
            display: flex; 
            justify-content: space-between; 
            gap: 20px;
            min-height: 80px;
            margin-top: 20px;
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
        
        <div style="
          width: 260px; 
          background: white; 
          border-radius: 6px; 
          border: 1px solid #e2e8f0;
          font-size: 13px;
          margin-left: 20px;
        ">
          <div style="
            background: #4a5568; 
            color: white; 
            padding: 8px 12px; 
            font-weight: 600;
          ">
            ${t.total || 'Summary'}
          </div>
          <div style="padding: 12px;">
            <div style="
              display: flex; 
              justify-content: space-between; 
              padding: 6px 0; 
              border-bottom: 1px solid #e2e8f0;
            ">
              <span>${t.netAmount || 'Subtotal'}</span>
              <span style="font-weight: 600;">${currencySymbol}${(proposalData.netAmount || 0).toFixed(2)}</span>
            </div>
            <div style="
              display: flex; 
              justify-content: space-between; 
              padding: 6px 0; 
              border-bottom: 1px solid #e2e8f0;
            ">
              <span>${t.vatPricing || 'VAT'} ${proposalData.vatEnabled ? `${proposalData.vatRate || 0}%` : '0%'}</span>
              <span style="font-weight: 600;">${currencySymbol}${(proposalData.vatEnabled ? ((proposalData.netAmount || 0) * (proposalData.vatRate || 0) / 100) : 0).toFixed(2)}</span>
            </div>
            <div style="
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0; 
              font-weight: 700; 
              background: #2d3748; 
              color: white; 
              margin: 8px -12px -12px -12px; 
              padding-left: 12px; 
              padding-right: 12px;
            ">
              <span>${t.totalAmount || 'Total Amount'}</span>
              <span>${currencySymbol}${(proposalData.vatEnabled ? ((proposalData.netAmount || 0) + ((proposalData.netAmount || 0) * (proposalData.vatRate || 0) / 100)) : (proposalData.netAmount || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Create second page content - Terms and conditionally payment data
const createSecondPageContent = (proposalData: any, language: string = "en") => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();
  
  // Get language-specific styling
  const fontFamily = getLanguageFont(language);
  const textDirection = getTextDirection(language);

  // Payment data (only if enabled)
  const paymentAccountNumber = proposalData.accountNumber || companyInfo.accountNumber || '12345678901234567';
  const paymentAccountName = proposalData.accountName || companyInfo.accountHolder || 'YOUR NAME';
  const paymentMethodValue = proposalData.paymentMethod || companyInfo.paymentMethod || 'CREDIT CARD';

  return `
    <style>
      * {
        box-sizing: border-box;
      }
      
      body, html {
        margin: 0;
        padding: 0;
        background: white;
      }
      
      .pdf-page {
        width: 794px;
        height: 1100px;
        background: white;
        margin: 0;
        padding: 20px;
        font-family: ${fontFamily};
        font-size: 14px;
        line-height: 1.4;
        color: #2d3748;
        direction: ${textDirection};
        overflow: hidden;
      }
      
      .section {
        margin-bottom: 20px;
      }
    </style>
    
    <div class="pdf-page">
      <!-- Terms and Conditions -->
      <div class="section" style="
        background: white; 
        padding: 15px; 
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

      <!-- Payment Data Section - Only if enabled -->
      ${proposalData.includePaymentData !== false ? `
      <div class="section" style="
        background: #e6fffa; 
        padding: 15px; 
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
      ` : ''}

      <!-- Footer Content -->
      ${proposalData.footerContent ? `
      <div class="section" style="
        padding: 15px; 
        background: #faf5ff; 
        border-radius: 6px; 
        border-left: 4px solid #805ad5;
      ">
        ${proposalData.footerContent}
      </div>
      ` : ''}

      <!-- Company Footer -->
      <div class="section" style="
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
  `;
};

// Generate PDF with separate pages
const generateMultiPagePDF = async (firstPageHtml: string, secondPageHtml: string): Promise<jsPDF> => {
  console.log('Starting multi-page PDF generation');
  
  // Create temporary divs for both pages
  const tempDiv1 = document.createElement("div");
  tempDiv1.style.position = "absolute";
  tempDiv1.style.left = "-9999px";
  tempDiv1.style.top = "-9999px";
  tempDiv1.innerHTML = firstPageHtml;
  document.body.appendChild(tempDiv1);
  
  const tempDiv2 = document.createElement("div");
  tempDiv2.style.position = "absolute";
  tempDiv2.style.left = "-9999px";
  tempDiv2.style.top = "-9999px";
  tempDiv2.innerHTML = secondPageHtml;
  document.body.appendChild(tempDiv2);
  
  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Generate first page
    console.log('Converting first page to canvas');
    const canvas1 = await html2canvas(tempDiv1, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1100
    });
    
    const imgData1 = canvas1.toDataURL('image/png');
    const imgWidth1 = pdfWidth;
    const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
    
    pdf.addImage(imgData1, 'PNG', 0, 0, imgWidth1, imgHeight1);
    
    // Generate second page
    console.log('Converting second page to canvas');
    const canvas2 = await html2canvas(tempDiv2, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1100
    });
    
    const imgData2 = canvas2.toDataURL('image/png');
    const imgWidth2 = pdfWidth;
    const imgHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
    
    pdf.addPage();
    pdf.addImage(imgData2, 'PNG', 0, 0, imgWidth2, imgHeight2);
    
    console.log('Multi-page PDF generation completed successfully');
    return pdf;
  } finally {
    document.body.removeChild(tempDiv1);
    document.body.removeChild(tempDiv2);
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
    
    // Generate HTML content for both pages - SIMPLE APPROACH
    const firstPageHtml = createFirstPageContent(proposalData, language);
    const secondPageHtml = createSecondPageContent(proposalData, language);
    
    if (!firstPageHtml || !secondPageHtml) {
      console.error('HTML content is empty');
      return false;
    }
    
    // Generate PDF with separate pages
    const pdf = await generateMultiPagePDF(firstPageHtml, secondPageHtml);
    
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
