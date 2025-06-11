
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

// Enhanced PDF content with proper page break handling
const createPDFContent = (proposalData: any, language: string = "en") => {
  const t = translations[language as keyof typeof translations] || translations.en;
  const companyInfo = getCompanyInfo();
  
  // Get language-specific styling
  const fontFamily = getLanguageFont(language);
  const textDirection = getTextDirection(language);

  // Original font sizes restored
  const baseFontSize = 12;
  const headerFontSize = 20;
  const titleFontSize = 18;
  const lineHeight = 1.4;
  const sectionSpacing = 20;
  const elementPadding = 15;

  // Calculate logo width based on logoSize
  const logoWidth = proposalData.logoSize ? `${proposalData.logoSize}%` : '33%';

  // Proper VAT handling with all user data
  console.log('PDF Generation - Using comprehensive translations for language:', language, proposalData);
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

  console.log('PDF Generation - Using translation keys:', {
    customer: t.customerInformation,
    proposal: t.createNewProposal,
    date: t.proposalDate,
    language,
    fontFamily,
    textDirection,
    availableKeys: Object.keys(t)
  });

  return `
    <div style="font-family: ${fontFamily}; direction: ${textDirection}; padding: ${elementPadding}px; max-width: 794px; background: #ffffff; margin: 0; box-sizing: border-box; font-size: ${baseFontSize}px; line-height: ${lineHeight}; color: #2d3748; position: relative;">
      
      <!-- PAGE 1 CONTENT -->
      
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${sectionSpacing}px; padding-bottom: ${elementPadding}px; border-bottom: 2px solid #e2e8f0; page-break-inside: avoid;">
        <div style="flex: 1; max-width: 62%;">
          <div style="font-weight: 600; font-size: ${headerFontSize}px; margin-bottom: 8px; color: #1a202c; letter-spacing: -0.3px;">${companyInfo.name}</div>
          <div style="line-height: ${lineHeight}; color: #4a5568; font-size: ${baseFontSize}px;">
            <div style="margin-bottom: 4px;">${companyInfo.street}</div>
            <div style="margin-bottom: 4px;">${companyInfo.postal} ${companyInfo.city}</div>
            <div style="color: #718096; font-size: ${baseFontSize - 1}px;">${companyInfo.country || 'Germany'}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #f7fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
            <img src="${proposalData.logo || companyInfo.logo}" style="max-height: 50px; max-width: ${logoWidth};" onerror="this.src='https://placehold.co/200x60?text=Your+Logo'; this.onerror=null;" />
          </div>
        </div>
      </div>

      <!-- Customer Information and Proposal Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: ${sectionSpacing}px; gap: 20px; page-break-inside: avoid;">
        <div style="flex: 1; background: #f8fafc; padding: ${elementPadding}px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-weight: 600; font-size: ${baseFontSize}px; margin-bottom: 10px; color: #2d3748; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #cbd5e0; padding-bottom: 6px;">${t.customerInformation || 'Customer'}</div>
          <div style="line-height: ${lineHeight}; font-size: ${baseFontSize}px;">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: ${baseFontSize + 1}px; color: #2d3748;">${proposalData.customerName || proposalData.customer || 'Name Surname'}</div>
            <div style="margin-bottom: 4px; color: #4a5568;">${proposalData.customerAddress || 'Leidsestraat 15, 2000 Antwerpen'}</div>
            <div style="margin-bottom: 4px; color: #4a5568;">${proposalData.customerEmail || 'customer@email.com'}</div>
            <div style="color: #718096; font-weight: 500;">${proposalData.customerCountry || 'Belgium'}</div>
          </div>
        </div>
        
        <div style="flex: 0 0 auto; min-width: 250px;">
          <div style="background: #f8fafc; padding: ${elementPadding}px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${baseFontSize - 1}px;">${t.proposalNumber || 'Proposal no.'}</span>
              <span style="font-weight: 600; color: #2d3748; font-size: ${baseFontSize}px;">${proposalData.number || 'AN-9993'}</span>
            </div>
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${baseFontSize - 1}px;">${t.proposalDate || 'Date'}</span>
              <span style="color: #4a5568; font-weight: 500; font-size: ${baseFontSize - 1}px;">${proposalDate}</span>
            </div>
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${baseFontSize - 1}px;">${t.customerReference || t.reference || 'Customer Ref'}</span>
              <span style="color: #4a5568; font-weight: 500; font-size: ${baseFontSize - 1}px;">${proposalData.customerRef || proposalData.reference || '—'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 500; color: #4a5568; font-size: ${baseFontSize - 1}px;">${t.internalContactPerson || 'Your Contact'}</span>
              <span style="color: #4a5568; font-weight: 500; font-size: ${baseFontSize - 1}px;">${proposalData.yourContact || proposalData.internalContact || 'Thomas Klein'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Proposal Title -->
      <div style="background: #2d3748; color: white; padding: ${elementPadding}px; border-radius: 6px; margin-bottom: ${sectionSpacing}px; page-break-inside: avoid;">
        <h2 style="margin: 0; font-size: ${titleFontSize}px; font-weight: 600; letter-spacing: -0.2px;">
          ${t.createNewProposal || 'Proposal'} ${proposalData.number || 'AN-9993'}
        </h2>
      </div>

      <!-- Proposal Content -->
      <div style="margin-bottom: ${sectionSpacing}px; background: white; padding: ${elementPadding}px; border-radius: 6px; border: 1px solid #e2e8f0; page-break-inside: avoid;">
        <div style="line-height: ${lineHeight}; font-size: ${baseFontSize}px;">
          <div style="font-weight: 600; font-size: ${baseFontSize + 2}px; color: #2d3748; margin-bottom: 8px;">
            ${proposalData.proposalTitle || proposalData.subject || 'Protect your online REPUTATION!'}
          </div>
          <div style="color: #4a5568; line-height: ${lineHeight}; font-size: ${baseFontSize}px;">
            ${proposalData.proposalDescription || 'Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.'}
            ${proposalData.content ? `<br/><br/>${proposalData.content}` : ''}
          </div>
        </div>
      </div>

      <!-- Products/Services Table with smart page breaks -->
      <div style="margin-bottom: ${sectionSpacing}px; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; page-break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; font-size: ${baseFontSize}px; background: white;">
          <thead>
            <tr style="background: #2d3748; color: white;">
              <th style="padding: 12px 15px; text-align: left; font-weight: 600; border: none; width: 50%; font-size: ${baseFontSize}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.productServiceName || t.description || 'Product/Service'}</th>
              <th style="padding: 12px 15px; text-align: center; font-weight: 600; border: none; width: 16%; font-size: ${baseFontSize}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.unitPrice || 'Price'}</th>
              <th style="padding: 12px 15px; text-align: center; font-weight: 600; border: none; width: 14%; font-size: ${baseFontSize}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.quantity || 'Qty'}</th>
              <th style="padding: 12px 15px; text-align: right; font-weight: 600; border: none; width: 20%; font-size: ${baseFontSize}px; text-transform: uppercase; letter-spacing: 0.2px;">${t.total || 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${(proposalData.lineItems || []).map((item: any, index: number) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? '#f8fafc' : 'white'}; page-break-inside: avoid;">
                <td style="padding: 12px 15px; border: none; vertical-align: top;">
                  <div style="font-weight: 600; margin-bottom: 4px; color: #2d3748; font-size: ${baseFontSize}px; line-height: 1.3;">
                    ${item.name || 'Product/Service Name'}
                  </div>
                  ${item.description || item.additionalInfo ? `
                  <div style="line-height: 1.3; color: #718096; font-size: ${baseFontSize - 1}px; margin-top: 4px;">
                    ${item.description || item.additionalInfo || ''}
                  </div>
                  ` : ''}
                </td>
                <td style="padding: 12px 15px; border: none; text-align: center; vertical-align: top; font-weight: 500; color: #4a5568; font-size: ${baseFontSize}px;">
                  ${currencySymbol}${(item.unit_price || 0).toFixed(2)}
                </td>
                <td style="padding: 12px 15px; border: none; text-align: center; vertical-align: top; font-weight: 500; color: #4a5568; font-size: ${baseFontSize}px;">
                  ${item.quantity || 1}
                </td>
                <td style="padding: 12px 15px; border: none; text-align: right; vertical-align: top; font-weight: 600; font-size: ${baseFontSize}px; color: #2d3748;">
                  ${currencySymbol}${(item.total_price || 0).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: ${sectionSpacing}px; page-break-inside: avoid;">
        <div style="width: 280px; background: white; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: #4a5568; color: white; padding: 10px 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2px; font-size: ${baseFontSize}px;">
            ${t.total || 'Summary'}
          </div>
          <div style="padding: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: ${baseFontSize}px;">
              <span style="color: #718096; font-weight: 500;">${t.netAmount || 'Subtotal'}</span>
              <span style="font-weight: 600; color: #2d3748;">${currencySymbol}${netAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: ${baseFontSize}px;">
              <span style="color: #718096; font-weight: 500;">${t.vatPricing || 'VAT'} ${isVatEnabled ? `${vatRate}%` : '0%'}</span>
              <span style="font-weight: 600; color: #2d3748;">${currencySymbol}${vatAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: 700; font-size: ${baseFontSize + 1}px; background: #2d3748; color: white; margin: 10px -15px -15px -15px; padding-left: 15px; padding-right: 15px;">
              <span>${t.totalAmount || 'Total Amount'}</span>
              <span>${currencySymbol}${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Smart page break before terms -->
      <div style="page-break-before: avoid; break-before: avoid;">
        <!-- TERMS AND CONDITIONS -->
        <div style="margin-bottom: ${sectionSpacing}px; background: white; padding: ${elementPadding}px; border-radius: 6px; border: 1px solid #e2e8f0; page-break-inside: avoid;">
          <div style="font-weight: 600; margin-bottom: 10px; text-transform: uppercase; color: #2d3748; font-size: ${baseFontSize}px; letter-spacing: 0.2px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${t.termsConditions || 'Terms and Conditions'}
          </div>
          <div style="line-height: ${lineHeight}; font-size: ${baseFontSize}px; color: #4a5568;">
            ${proposalData.paymentTerms || proposalData.deliveryTerms || t.paymentTerms || 'Payment terms will be specified here.'}
            ${proposalData.termsAndConditions ? `<br/><br/>${proposalData.termsAndConditions}` : ''}
          </div>
        </div>

        <!-- Signature Section -->
        <div style="display: flex; justify-content: space-between; margin-bottom: ${sectionSpacing}px; gap: 20px; page-break-inside: avoid;">
          <div style="width: 45%; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="border-top: 2px solid #2d3748; padding-top: 8px;">
              <div style="font-size: ${baseFontSize - 1}px; color: #718096; font-weight: 500; text-transform: uppercase; letter-spacing: 0.2px;">Place & Date</div>
            </div>
          </div>
          <div style="width: 45%; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="border-top: 2px solid #2d3748; padding-top: 8px;">
              <div style="font-size: ${baseFontSize - 1}px; color: #718096; font-weight: 500; text-transform: uppercase; letter-spacing: 0.2px;">Signature & Stamp</div>
              ${proposalData.signatureUrl ? `<img src="${proposalData.signatureUrl}" style="max-height: 30px; margin-top: 8px;" />` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- CONTROLLED PAGE BREAK -->
      <div style="page-break-before: always; break-before: page; height: 1px; overflow: hidden; margin: 0; padding: 0; border: none; visibility: hidden; clear: both; display: block; width: 100%;"><!-- FORCED PAGE BREAK --></div>

      <!-- PAGE 2 CONTENT STARTS HERE -->
      
      <!-- Top spacing for second page -->
      <div style="height: 30px; width: 100%; clear: both; display: block; margin: 0; padding: 0;"></div>

      <!-- PAYMENT DATA Section - Green background -->
      <div style="margin-bottom: ${sectionSpacing}px; background: #e6fffa !important; padding: ${elementPadding}px !important; border-radius: 6px; border-left: 4px solid #38a169 !important; border: 1px solid #81e6d9 !important; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid; position: relative; display: block; clear: both; width: 100%; min-height: 120px; overflow: visible;">
        <div style="font-weight: 600; margin-bottom: 12px; color: #2d6b4f !important; font-size: ${baseFontSize + 1}px; text-transform: uppercase; letter-spacing: 0.2px; line-height: 1.3;">
          ${t.paymentData || 'Payment Data'}
        </div>
        <div style="line-height: 1.5; font-size: ${baseFontSize}px; color: #2d6b4f !important;">
          <div style="margin-bottom: 8px; display: flex; align-items: center;">
            <strong style="min-width: 120px; display: inline-block; color: #2d6b4f !important;">${t.accountNumber || 'Account Nr'}</strong> 
            <span style="color: #2d6b4f !important;">${paymentAccountNumber}</span>
          </div>
          <div style="margin-bottom: 8px; display: flex; align-items: center;">
            <strong style="min-width: 120px; display: inline-block; color: #2d6b4f !important;">${t.accountName || 'Name'}</strong> 
            <span style="color: #2d6b4f !important;">${paymentAccountName}</span>
          </div>
          <div style="display: flex; align-items: center;">
            <strong style="min-width: 120px; display: inline-block; color: #2d6b4f !important;">${t.paymentMethod || 'Payment Method'}</strong> 
            <span style="color: #2d6b4f !important;">${paymentMethodValue}</span>
          </div>
        </div>
      </div>

      <!-- Footer Content -->
      ${proposalData.footerContent ? `
      <div style="margin-bottom: ${sectionSpacing}px; padding: ${elementPadding}px; background: #faf5ff; border-radius: 6px; border-left: 4px solid #805ad5; border: 1px solid #e9d8fd; page-break-inside: avoid;">
        <div style="line-height: ${lineHeight}; font-size: ${baseFontSize}px; color: #553c9a;">
          ${proposalData.footerContent}
        </div>
      </div>
      ` : ''}

      <!-- COMPANY FOOTER -->
      <div style="background: #2d3748; border-radius: 6px; margin-top: ${sectionSpacing}px; width: 100%; clear: both; position: relative; page-break-inside: avoid; break-inside: avoid; box-sizing: border-box; min-height: 140px; display: block;">
        <!-- Company Name Header -->
        <div style="background: rgba(255,255,255,0.1); padding: 8px 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div style="color: white; font-weight: 600; font-size: ${baseFontSize}px; text-align: center; letter-spacing: 0.4px;">
            ${companyInfo.name || 'AB MEDIA TEAM LTD'}
          </div>
        </div>
        
        <!-- Contact Information Grid -->
        <div style="padding: 12px 15px; color: white; font-size: ${baseFontSize - 2}px;">
          
          <!-- Phone & Fax -->
          <div style="margin-bottom: 10px;">
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
              <div style="font-weight: 500; margin-bottom: 3px; color: #cbd5e0; font-size: ${baseFontSize - 2}px;">
                ${companyInfo.contactPerson || 'Andreas Berger'}
              </div>
              <div style="line-height: 1.3; font-size: ${baseFontSize - 3}px;">
                ${companyInfo.street || 'Weseler Str.73'}<br/>
                ${companyInfo.postal || '47169'} ${companyInfo.city || 'Duisburg'}<br/>
                ${companyInfo.country || 'Germany'}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Business Information -->
        <div style="background: rgba(255,255,255,0.05); padding: 8px 15px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="color: #cbd5e0; font-size: ${baseFontSize - 3}px;">
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

// Enhanced PDF generation with readable fonts and better canvas settings
const generatePDFFromHTML = async (htmlContent: string): Promise<jsPDF> => {
  // Create a temporary div to render the proposal with proper dimensions
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  tempDiv.style.width = "794px"; // A4 width in pixels at 96 DPI
  tempDiv.style.minHeight = "1800px"; // Sufficient height for content flow
  tempDiv.style.backgroundColor = "white";
  tempDiv.style.overflow = "visible";
  
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);
  
  // Wait for layout to stabilize and fonts to load
  await new Promise(resolve => setTimeout(resolve, 1500)); // Increased wait time for font loading
  
  try {
    // Get the actual content height with proper buffer
    const actualHeight = Math.max(tempDiv.scrollHeight + 120, 1800);
    
    console.log('PDF Generation - Enhanced font rendering for crisp text');
    
    // Convert the HTML to canvas with settings optimized for font rendering
    const canvas = await html2canvas(tempDiv, {
      scale: 2.0, // Higher scale for better font rendering
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: actualHeight,
      windowWidth: 794,
      windowHeight: actualHeight,
      // Enhanced font rendering options
      foreignObjectRendering: true,
      imageTimeout: 30000,
      onclone: (clonedDoc) => {
        // Ensure payment section renders properly in the clone
        const paymentSections = clonedDoc.querySelectorAll('[style*="PAYMENT DATA"], [style*="ZAHLUNGSDATEN"], [style*="DATOS DE PAGO"]');
        paymentSections.forEach(section => {
          if (section instanceof HTMLElement) {
            section.style.backgroundColor = '#e6fffa';
            section.style.borderLeft = '4px solid #38a169';
            section.style.pageBreakInside = 'avoid';
            section.style.breakInside = 'avoid';
            section.style.display = 'block';
            section.style.width = '100%';
            section.style.boxSizing = 'border-box';
          }
        });
        
        // Ensure green text color is preserved
        const paymentText = clonedDoc.querySelectorAll('[style*="color: #2d6b4f"]');
        paymentText.forEach(text => {
          if (text instanceof HTMLElement) {
            text.style.color = '#2d6b4f !important';
          }
        });

        // Force font loading and rendering for better quality
        const allText = clonedDoc.querySelectorAll('*');
        allText.forEach(element => {
          if (element instanceof HTMLElement) {
            // Use proper CSS properties that TypeScript recognizes
            element.style.textRendering = 'optimizeLegibility';
            (element.style as any).webkitFontSmoothing = 'antialiased';
            (element.style as any).mozOsxFontSmoothing = 'grayscale';
          }
        });
      }
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality PNG
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions for proper fitting
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Handle multi-page content with improved page break logic
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
    
    console.log('PDF Generation - Enhanced font rendering complete with crisp text quality');
    
    return pdf;
  } finally {
    document.body.removeChild(tempDiv);
  }
};

// Main function to generate a PDF from a proposal - now with language-specific fonts
export const generateProposalPDF = async (
  proposalData: any, 
  language: string = "en", 
  customFilename?: string
): Promise<jsPDF | boolean> => {
  try {
    console.log('Generating PDF with language-specific fonts for:', language, proposalData);
    
    // Generate HTML content using language-specific fonts
    const htmlContent = createPDFContent(proposalData, language);
    
    // Generate PDF with enhanced font rendering
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
    
    // Add language options using SUPPORTED_LANGUAGES from proposalTranslations
    SUPPORTED_LANGUAGES.forEach(lang => {
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

    // Handler for logo size adjustment - regenerates with language-specific fonts
    let currentLogoSize = proposalData.logoSize || 33;

    const updatePreview = async (newLogoSize: number, newLanguage: string) => {
      const updatedProposalData = {
        ...proposalData, 
        previewMode: true,
        logoSize: newLogoSize
      };
      
      // Generate new PDF with language-specific fonts
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
    
    // Add event listener to language selector - regenerates with language-specific fonts
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
