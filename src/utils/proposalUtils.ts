import { v4 as uuidv4 } from "uuid";

// Define the available proposal statuses
export const PROPOSAL_STATUSES = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
  "Revised"
];

// Function to get currency symbol
export const getCurrencySymbol = (currency: string = 'EUR') => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'EUR':
    default:
      return '€';
  }
};

export const generateProposalPDF = async (proposalData: any, language: string = 'en', filename?: string): Promise<boolean> => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Define colors
    const darkBlue = [0, 75, 145]; // RGB
    const lightBlue = [100, 180, 230]; // RGB
    
    // Set up fonts
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add logo if provided
    if (proposalData.logo) {
      try {
        const logoSize = proposalData.logoSize || 33; // Default to 33% if not specified
        const logoWidth = (pageWidth - (margin * 2)) * (logoSize / 100);
        doc.addImage(proposalData.logo, 'JPEG', margin, yPosition, logoWidth, 30);
        yPosition += 40;
      } catch (e) {
        console.error('Error adding logo:', e);
        // Continue without logo if there's an error
      }
    } else {
      // Add company name as text if no logo
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('COMPANY NAME', margin, yPosition + 15);
      yPosition += 40;
    }
    
    // Add proposal header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text('PROPOSAL', margin, yPosition);
    
    // Add proposal number and date on the right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const proposalNumberText = `Proposal #: ${proposalData.number}`;
    const proposalNumberWidth = doc.getTextWidth(proposalNumberText);
    doc.text(proposalNumberText, pageWidth - margin - proposalNumberWidth, yPosition - 10);
    
    const dateText = `Date: ${new Date(proposalData.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin - dateWidth, yPosition);
    
    yPosition += 20;
    
    // Add customer information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (proposalData.customerName) {
      doc.text(proposalData.customerName, margin, yPosition);
      yPosition += 5;
    }
    
    if (proposalData.customerAddress) {
      const addressLines = doc.splitTextToSize(proposalData.customerAddress, contentWidth / 2);
      doc.text(addressLines, margin, yPosition);
      yPosition += addressLines.length * 5 + 2;
    }
    
    if (proposalData.customerEmail) {
      doc.text(`Email: ${proposalData.customerEmail}`, margin, yPosition);
      yPosition += 5;
    }
    
    if (proposalData.customerRef) {
      doc.text(`Reference: ${proposalData.customerRef}`, margin, yPosition);
      yPosition += 5;
    }
    
    // Add contact information on the right
    if (proposalData.yourContact) {
      const contactY = yPosition - 25;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Your Contact', pageWidth / 2, contactY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(proposalData.yourContact, pageWidth / 2, contactY + 8);
    }
    
    yPosition += 15;
    
    // Add proposal title and description
    if (proposalData.proposalTitle) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text(proposalData.proposalTitle, margin, yPosition);
      yPosition += 10;
    }
    
    if (proposalData.proposalDescription) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const descLines = doc.splitTextToSize(proposalData.proposalDescription, contentWidth);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 10;
    }
    
    // Add additional content if provided
    if (proposalData.content) {
      const contentLines = doc.splitTextToSize(proposalData.content, contentWidth);
      doc.text(contentLines, margin, yPosition);
      yPosition += contentLines.length * 5 + 10;
    }
    
    // Add line items table
    if (proposalData.lineItems && proposalData.lineItems.length > 0) {
      // Check if we need a new page for the table
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('Products & Services', margin, yPosition);
      yPosition += 10;
      
      // Table headers
      doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Description', margin + 5, yPosition + 5.5);
      doc.text('Qty', margin + contentWidth * 0.6, yPosition + 5.5);
      doc.text('Unit Price', margin + contentWidth * 0.7, yPosition + 5.5);
      doc.text('Total', margin + contentWidth * 0.85, yPosition + 5.5);
      
      yPosition += 8;
      
      // Table rows
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      let alternateRow = false;
      
      for (const item of proposalData.lineItems) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 30;
          
          // Redraw table header on new page
          doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
          doc.rect(margin, yPosition, contentWidth, 8, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Description', margin + 5, yPosition + 5.5);
          doc.text('Qty', margin + contentWidth * 0.6, yPosition + 5.5);
          doc.text('Unit Price', margin + contentWidth * 0.7, yPosition + 5.5);
          doc.text('Total', margin + contentWidth * 0.85, yPosition + 5.5);
          
          yPosition += 8;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          alternateRow = false;
        }
        
        // Alternate row background
        if (alternateRow) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPosition, contentWidth, 20, 'F');
        }
        alternateRow = !alternateRow;
        
        // Item name and description
        const itemName = item.name || '';
        const itemDesc = item.description || item.additionalInfo || '';
        
        doc.setFont('helvetica', 'bold');
        doc.text(itemName, margin + 5, yPosition + 5);
        doc.setFont('helvetica', 'normal');
        
        if (itemDesc) {
          const descLines = doc.splitTextToSize(itemDesc, contentWidth * 0.55);
          doc.text(descLines, margin + 5, yPosition + 10);
          
          // Adjust row height based on description length
          const rowHeight = Math.max(20, descLines.length * 5 + 10);
          
          // Quantity, price and total
          const currencySymbol = getCurrencySymbol(proposalData.currency);
          doc.text(item.quantity.toString(), margin + contentWidth * 0.6, yPosition + 5);
          doc.text(`${currencySymbol}${item.unit_price.toFixed(2)}`, margin + contentWidth * 0.7, yPosition + 5);
          doc.text(`${currencySymbol}${item.total_price.toFixed(2)}`, margin + contentWidth * 0.85, yPosition + 5);
          
          yPosition += rowHeight;
        } else {
          // Quantity, price and total
          const currencySymbol = getCurrencySymbol(proposalData.currency);
          doc.text(item.quantity.toString(), margin + contentWidth * 0.6, yPosition + 5);
          doc.text(`${currencySymbol}${item.unit_price.toFixed(2)}`, margin + contentWidth * 0.7, yPosition + 5);
          doc.text(`${currencySymbol}${item.total_price.toFixed(2)}`, margin + contentWidth * 0.85, yPosition + 5);
          
          yPosition += 20;
        }
      }
      
      // Add totals
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, margin + contentWidth, yPosition);
      yPosition += 10;
      
      const currencySymbol = getCurrencySymbol(proposalData.currency);
      
      // Net amount
      doc.text('Net Amount:', margin + contentWidth * 0.7, yPosition);
      doc.text(`${currencySymbol}${proposalData.netAmount.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
      yPosition += 8;
      
      // VAT if enabled
      if (proposalData.vatEnabled) {
        doc.text(`VAT (${proposalData.vatRate}%):`, margin + contentWidth * 0.7, yPosition);
        doc.text(`${currencySymbol}${proposalData.vatAmount.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
        yPosition += 8;
      }
      
      // Total amount
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', margin + contentWidth * 0.7, yPosition);
      doc.text(`${currencySymbol}${proposalData.totalAmount.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
      yPosition += 15;
    }
    
    // Move to second page before payment data to avoid splitting
    if (yPosition > pageHeight * 0.4) { // If we're past 40% of first page
      doc.addPage();
      yPosition = 30;
    } else {
      // Add enough space to push payment data to second page
      yPosition = pageHeight - 40; // Position near bottom to force page break
      doc.addPage();
      yPosition = 30;
    }
    
    // Payment Data Section (now guaranteed to be on second page)
    if (proposalData.accountNumber || proposalData.accountName || proposalData.paymentMethod) {
      yPosition += 20; // Extra spacing before payment section
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('Payment Information', margin, yPosition);
      yPosition += 15;
      
      // Reset to normal text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (proposalData.accountNumber) {
        doc.text(`Account Number: ${proposalData.accountNumber}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (proposalData.accountName) {
        doc.text(`Account Name: ${proposalData.accountName}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (proposalData.paymentMethod) {
        doc.text(`Payment Method: ${proposalData.paymentMethod}`, margin, yPosition);
        yPosition += 8;
      }
      
      yPosition += 10;
    }
    
    // Terms and Conditions Section
    if (proposalData.deliveryTerms || proposalData.paymentTerms || proposalData.termsAndConditions) {
      yPosition += 10;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('Terms & Conditions', margin, yPosition);
      yPosition += 15;
      
      // Reset to normal text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (proposalData.deliveryTerms) {
        doc.text('Delivery Terms:', margin, yPosition);
        yPosition += 6;
        const deliveryLines = doc.splitTextToSize(proposalData.deliveryTerms, contentWidth - 20);
        doc.text(deliveryLines, margin + 10, yPosition);
        yPosition += deliveryLines.length * 5 + 8;
      }
      
      if (proposalData.paymentTerms) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.text('Payment Terms:', margin, yPosition);
        yPosition += 6;
        const paymentLines = doc.splitTextToSize(proposalData.paymentTerms, contentWidth - 20);
        doc.text(paymentLines, margin + 10, yPosition);
        yPosition += paymentLines.length * 5 + 8;
      }
      
      if (proposalData.termsAndConditions) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.text('Additional Terms:', margin, yPosition);
        yPosition += 6;
        const termsLines = doc.splitTextToSize(proposalData.termsAndConditions, contentWidth - 20);
        doc.text(termsLines, margin + 10, yPosition);
        yPosition += termsLines.length * 5 + 8;
      }
    }
    
    // Footer content at the bottom of the last page
    if (proposalData.footerContent) {
      // Move to bottom of current page
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      const footerY = pageHeight - 40;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const footerLines = doc.splitTextToSize(proposalData.footerContent, contentWidth);
      doc.text(footerLines, margin, footerY);
    }
    
    // Save or download the PDF
    if (filename) {
      doc.save(filename);
    } else {
      doc.save(`proposal-${proposalData.number}.pdf`);
    }
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const previewProposalPDF = async (proposalData: any, language: string = 'en'): Promise<boolean> => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Define colors
    const darkBlue = [0, 75, 145]; // RGB
    const lightBlue = [100, 180, 230]; // RGB
    
    // Set up fonts
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add logo if provided
    if (proposalData.logo) {
      try {
        const logoSize = proposalData.logoSize || 33; // Default to 33% if not specified
        const logoWidth = (pageWidth - (margin * 2)) * (logoSize / 100);
        doc.addImage(proposalData.logo, 'JPEG', margin, yPosition, logoWidth, 30);
        yPosition += 40;
      } catch (e) {
        console.error('Error adding logo:', e);
        // Continue without logo if there's an error
      }
    } else {
      // Add company name as text if no logo
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('COMPANY NAME', margin, yPosition + 15);
      yPosition += 40;
    }
    
    // Add proposal header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text('PROPOSAL', margin, yPosition);
    
    // Add proposal number and date on the right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const proposalNumberText = `Proposal #: ${proposalData.number}`;
    const proposalNumberWidth = doc.getTextWidth(proposalNumberText);
    doc.text(proposalNumberText, pageWidth - margin - proposalNumberWidth, yPosition - 10);
    
    const dateText = `Date: ${new Date(proposalData.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin - dateWidth, yPosition);
    
    yPosition += 20;
    
    // Add customer information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (proposalData.customerName) {
      doc.text(proposalData.customerName, margin, yPosition);
      yPosition += 5;
    }
    
    if (proposalData.customerAddress) {
      const addressLines = doc.splitTextToSize(proposalData.customerAddress, contentWidth / 2);
      doc.text(addressLines, margin, yPosition);
      yPosition += addressLines.length * 5 + 2;
    }
    
    if (proposalData.customerEmail) {
      doc.text(`Email: ${proposalData.customerEmail}`, margin, yPosition);
      yPosition += 5;
    }
    
    if (proposalData.customerRef) {
      doc.text(`Reference: ${proposalData.customerRef}`, margin, yPosition);
      yPosition += 5;
    }
    
    // Add contact information on the right
    if (proposalData.yourContact) {
      const contactY = yPosition - 25;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Your Contact', pageWidth / 2, contactY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(proposalData.yourContact, pageWidth / 2, contactY + 8);
    }
    
    yPosition += 15;
    
    // Add proposal title and description
    if (proposalData.proposalTitle) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text(proposalData.proposalTitle, margin, yPosition);
      yPosition += 10;
    }
    
    if (proposalData.proposalDescription) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const descLines = doc.splitTextToSize(proposalData.proposalDescription, contentWidth);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 10;
    }
    
    // Add additional content if provided
    if (proposalData.content) {
      const contentLines = doc.splitTextToSize(proposalData.content, contentWidth);
      doc.text(contentLines, margin, yPosition);
      yPosition += contentLines.length * 5 + 10;
    }
    
    // Add line items table
    if (proposalData.lineItems && proposalData.lineItems.length > 0) {
      // Check if we need a new page for the table
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('Products & Services', margin, yPosition);
      yPosition += 10;
      
      // Table headers
      doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Description', margin + 5, yPosition + 5.5);
      doc.text('Qty', margin + contentWidth * 0.6, yPosition + 5.5);
      doc.text('Unit Price', margin + contentWidth * 0.7, yPosition + 5.5);
      doc.text('Total', margin + contentWidth * 0.85, yPosition + 5.5);
      
      yPosition += 8;
      
      // Table rows
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      let alternateRow = false;
      
      for (const item of proposalData.lineItems) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 30;
          
          // Redraw table header on new page
          doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
          doc.rect(margin, yPosition, contentWidth, 8, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Description', margin + 5, yPosition + 5.5);
          doc.text('Qty', margin + contentWidth * 0.6, yPosition + 5.5);
          doc.text('Unit Price', margin + contentWidth * 0.7, yPosition + 5.5);
          doc.text('Total', margin + contentWidth * 0.85, yPosition + 5.5);
          
          yPosition += 8;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          alternateRow = false;
        }
        
        // Alternate row background
        if (alternateRow) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPosition, contentWidth, 20, 'F');
        }
        alternateRow = !alternateRow;
        
        // Item name and description
        const itemName = item.name || '';
        const itemDesc = item.description || item.additionalInfo || '';
        
        doc.setFont('helvetica', 'bold');
        doc.text(itemName, margin + 5, yPosition + 5);
        doc.setFont('helvetica', 'normal');
        
        if (itemDesc) {
          const descLines = doc.splitTextToSize(itemDesc, contentWidth * 0.55);
          doc.text(descLines, margin + 5, yPosition + 10);
          
          // Adjust row height based on description length
          const rowHeight = Math.max(20, descLines.length * 5 + 10);
          
          // Quantity, price and total
          const currencySymbol = getCurrencySymbol(proposalData.currency);
          doc.text(item.quantity.toString(), margin + contentWidth * 0.6, yPosition + 5);
          doc.text(`${currencySymbol}${item.unit_price.toFixed(2)}`, margin + contentWidth * 0.7, yPosition + 5);
          doc.text(`${currencySymbol}${item.total_price.toFixed(2)}`, margin + contentWidth * 0.85, yPosition + 5);
          
          yPosition += rowHeight;
        } else {
          // Quantity, price and total
          const currencySymbol = getCurrencySymbol(proposalData.currency);
          doc.text(item.quantity.toString(), margin + contentWidth * 0.6, yPosition + 5);
          doc.text(`${currencySymbol}${item.unit_price.toFixed(2)}`, margin + contentWidth * 0.7, yPosition + 5);
          doc.text(`${currencySymbol}${item.total_price.toFixed(2)}`, margin + contentWidth * 0.85, yPosition + 5);
          
          yPosition += 20;
        }
      }
      
      // Add totals
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, margin + contentWidth, yPosition);
      yPosition += 10;
      
      const currencySymbol = getCurrencySymbol(proposalData.currency);
      
      // Net amount
      doc.text('Net Amount:', margin + contentWidth * 0.7, yPosition);
      doc.text(`${currencySymbol}${proposalData.netAmount.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
      yPosition += 8;
      
      // VAT if enabled
      if (proposalData.vatEnabled) {
        doc.text(`VAT (${proposalData.vatRate}%):`, margin + contentWidth * 0.7, yPosition);
        doc.text(`${currencySymbol}${proposalData.vatAmount.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
        yPosition += 8;
      }
      
      // Total amount
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', margin + contentWidth * 0.7, yPosition);
      doc.text(`${currencySymbol}${proposalData.totalAmount.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
      yPosition += 15;
    }
    
    // Move to second page before payment data to avoid splitting
    if (yPosition > pageHeight * 0.4) { // If we're past 40% of first page
      doc.addPage();
      yPosition = 30;
    } else {
      // Add enough space to push payment data to second page
      yPosition = pageHeight - 40; // Position near bottom to force page break
      doc.addPage();
      yPosition = 30;
    }
    
    // Payment Data Section (now guaranteed to be on second page)
    if (proposalData.accountNumber || proposalData.accountName || proposalData.paymentMethod) {
      yPosition += 20; // Extra spacing before payment section
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('Payment Information', margin, yPosition);
      yPosition += 15;
      
      // Reset to normal text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (proposalData.accountNumber) {
        doc.text(`Account Number: ${proposalData.accountNumber}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (proposalData.accountName) {
        doc.text(`Account Name: ${proposalData.accountName}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (proposalData.paymentMethod) {
        doc.text(`Payment Method: ${proposalData.paymentMethod}`, margin, yPosition);
        yPosition += 8;
      }
      
      yPosition += 10;
    }
    
    // Terms and Conditions Section
    if (proposalData.deliveryTerms || proposalData.paymentTerms || proposalData.termsAndConditions) {
      yPosition += 10;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.text('Terms & Conditions', margin, yPosition);
      yPosition += 15;
      
      // Reset to normal text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      if (proposalData.deliveryTerms) {
        doc.text('Delivery Terms:', margin, yPosition);
        yPosition += 6;
        const deliveryLines = doc.splitTextToSize(proposalData.deliveryTerms, contentWidth - 20);
        doc.text(deliveryLines, margin + 10, yPosition);
        yPosition += deliveryLines.length * 5 + 8;
      }
      
      if (proposalData.paymentTerms) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.text('Payment Terms:', margin, yPosition);
        yPosition += 6;
        const paymentLines = doc.splitTextToSize(proposalData.paymentTerms, contentWidth - 20);
        doc.text(paymentLines, margin + 10, yPosition);
        yPosition += paymentLines.length * 5 + 8;
      }
      
      if (proposalData.termsAndConditions) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.text('Additional Terms:', margin, yPosition);
        yPosition += 6;
        const termsLines = doc.splitTextToSize(proposalData.termsAndConditions, contentWidth - 20);
        doc.text(termsLines, margin + 10, yPosition);
        yPosition += termsLines.length * 5 + 8;
      }
    }
    
    // Footer content at the bottom of the last page
    if (proposalData.footerContent) {
      // Move to bottom of current page
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      const footerY = pageHeight - 40;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const footerLines = doc.splitTextToSize(proposalData.footerContent, contentWidth);
      doc.text(footerLines, margin, footerY);
    }
    
    // Open in new tab instead of downloading
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    return true;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return false;
  }
};

// Load inventory items from localStorage
export const loadInventoryItems = () => {
  try {
    const savedItems = localStorage.getItem("inventoryItems");
    if (savedItems) {
      return JSON.parse(savedItems);
    }
    return [];
  } catch (error) {
    console.error("Error loading inventory items:", error);
    return [];
  }
};

// Format inventory item for proposal line item
export const formatInventoryItemForProposal = (inventoryItem: any, quantity: number = 1) => {
  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const numStr = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(numStr) || 0;
  };
  
  const unitPrice = parsePrice(inventoryItem.price);
  
  return {
    id: uuidv4(),
    item_id: inventoryItem.id,
    name: inventoryItem.name,
    description: inventoryItem.description || '',
    quantity: quantity,
    unit_price: unitPrice,
    total_price: quantity * unitPrice,
    category: inventoryItem.category,
    unit: inventoryItem.unit || 'unit',
    created_at: new Date().toISOString()
  };
};
