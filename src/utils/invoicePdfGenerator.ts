
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, InvoiceLineItem, Client } from '@/types/invoice';
import { formatCurrency } from '@/utils/currencyUtils';

interface InvoicePDFData {
  invoice?: Invoice;
  lineItems: InvoiceLineItem[];
  client?: Client;
  templateSettings: any;
  formData?: any;
}

export const generateInvoicePDF = async (data: InvoicePDFData): Promise<void> => {
  const { invoice, lineItems, client, templateSettings, formData } = data;
  
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
    // Generate the invoice HTML
    container.innerHTML = generateInvoiceHTML(data);
    
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
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Download the PDF
    const invoiceNumber = invoice?.invoice_number || formData?.invoice_number || 'new';
    pdf.save(`invoice-${invoiceNumber}.pdf`);
    
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

const generateInvoiceHTML = (data: InvoicePDFData): string => {
  const { invoice, lineItems, client, templateSettings, formData } = data;
  
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
  const selectedAccount = templateSettings.selectedPaymentAccount === "belgium" 
    ? {
        name: "Bankrekening België",
        iban: "BE79967023897833",
        bic: "TRWIBEB1XXX",
        blz: "967",
        account: "967023897833"
      }
    : {
        name: "German Bank Account",
        iban: "DE91240703680071572200",
        bic: "DEUTDE2HP22",
        bank: "Postbank/DSL Ndl of Deutsche Bank"
      };

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
        terms: "Terms:"
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
        terms: "Voorwaarden:"
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
        terms: "Bedingungen:"
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
        terms: "Conditions:"
      }
    };
    
    const lang = templateSettings.language || 'en';
    return translations[lang]?.[key] || translations.en[key];
  };

  const currentInvoiceData = invoice || {
    invoice_number: 'NEW',
    issue_date: formData?.issue_date || new Date().toISOString(),
    due_date: formData?.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString()
  };

  return `
    <div style="background: white; min-height: 800px; padding: 32px; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${templateSettings.logo ? `
            <img 
              src="${templateSettings.logo}" 
              alt="Company Logo" 
              style="height: ${
                templateSettings.logoSize === "small" ? "48px" :
                templateSettings.logoSize === "medium" ? "64px" :
                "80px"
              }; width: auto; object-fit: contain;"
            />
          ` : ''}
          <div>
            <h1 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0;">
              ${templateSettings.companyInfo.name}
            </h1>
          </div>
        </div>
        
        <div style="text-align: right;">
          <h2 style="font-size: 32px; font-weight: bold; color: #4b5563; margin: 0;">
            ${templateSettings.invoiceNumberPrefix || 'RE NR:'}${currentInvoiceData.invoice_number}
          </h2>
          <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">
            # ${templateSettings.invoiceNumberPrefix || 'RE NR:'}${currentInvoiceData.invoice_number}
          </p>
        </div>
      </div>

      <!-- Company Details and Invoice Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
        <div>
          <div style="font-size: 14px; color: #374151; line-height: 1.4;">
            <div style="font-weight: bold;">${templateSettings.companyInfo.name}</div>
            <div>Company Registration Number: ${templateSettings.companyInfo.registrationNumber}</div>
            <div>UID- Number: ${templateSettings.companyInfo.vatId}</div>
            <div>${templateSettings.companyInfo.street} ${templateSettings.companyInfo.postal} ${templateSettings.companyInfo.city}</div>
            <div>${templateSettings.companyInfo.email}</div>
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="margin-bottom: 8px;">
            <span>${getTranslatedText('date')}</span>
            <span style="float: right;">${formatDate(currentInvoiceData.issue_date)}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span>${getTranslatedText('dueDate')}</span>
            <span style="float: right;">${formatDate(currentInvoiceData.due_date)}</span>
          </div>
          <div style="font-weight: bold; font-size: 18px;">
            <span>${getTranslatedText('balanceDue')}</span>
            <span style="float: right;">${formatCurrency(total || 750, templateSettings.currency)}</span>
          </div>
        </div>
      </div>

      <!-- Bill To -->
      <div style="margin-bottom: 32px;">
        <div style="font-weight: bold; color: #374151; margin-bottom: 8px;">${getTranslatedText('billTo')}</div>
        <div style="font-size: 14px; color: #374151; line-height: 1.4;">
          ${client ? `
            <div style="font-weight: bold;">${client.name}</div>
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

      <!-- Invoice Items Table -->
      <div style="margin: 32px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1f2937; color: white;">
              <th style="text-align: left; padding: 12px 16px;">${getTranslatedText('item')}</th>
              <th style="text-align: center; padding: 12px 16px;">${getTranslatedText('quantity')}</th>
              <th style="text-align: right; padding: 12px 16px;">${getTranslatedText('rate')}</th>
              <th style="text-align: right; padding: 12px 16px;">${getTranslatedText('amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.length > 0 ? lineItems.map((item, index) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 16px;">${item.item_description}</td>
                <td style="text-align: center; padding: 12px 16px;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px 16px;">${formatCurrency(item.unit_price, templateSettings.currency)}</td>
                <td style="text-align: right; padding: 12px 16px;">${formatCurrency(item.quantity * item.unit_price * (1 - item.discount_rate), templateSettings.currency)}</td>
              </tr>
            `).join('') : `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 16px;">Sample Service</td>
                <td style="text-align: center; padding: 12px 16px;">1</td>
                <td style="text-align: right; padding: 12px 16px;">${formatCurrency(750, templateSettings.currency)}</td>
                <td style="text-align: right; padding: 12px 16px;">${formatCurrency(750, templateSettings.currency)}</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin: 24px 0;">
        <div style="width: 256px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>${getTranslatedText('subtotal')}</span>
            <span>${formatCurrency(subtotal || 750, templateSettings.currency)}</span>
          </div>
          ${templateSettings.vatEnabled ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>${getTranslatedText('tax')} (${templateSettings.vatRate}%):</span>
              <span>${formatCurrency(vatAmount, templateSettings.currency)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            <span>${getTranslatedText('total')}</span>
            <span>${formatCurrency(total || 750, templateSettings.currency)}</span>
          </div>
        </div>
      </div>

      <!-- Notes and Terms -->
      <div style="margin-top: 32px;">
        <div>
          <div style="font-weight: bold; color: #374151; margin-bottom: 8px;">${getTranslatedText('notes')}</div>
          <div style="font-size: 14px; color: #4b5563; margin-bottom: 16px;">
            ${templateSettings.customTerms || formData?.notes || 
             "We verzoeken dat de door ons gefactureerde diensten binnen 3 dagen worden gecrediteerd/overgemaakt. Alle belastingen en sociale premies worden door ons aangegeven en afgedragen aan de autoriteiten."}
          </div>
        </div>
        
        <div>
          <div style="font-weight: bold; color: #374151; margin-bottom: 8px;">${getTranslatedText('terms')}</div>
          <div style="font-size: 14px; color: #4b5563; line-height: 1.4;">
            <div>${selectedAccount.name}:</div>
            <div>IBAN: ${selectedAccount.iban}</div>
            <div>BIC: ${selectedAccount.bic}</div>
            ${selectedAccount.blz ? `<div>BLZ: ${selectedAccount.blz} KONTO: ${selectedAccount.account}</div>` : ''}
            ${selectedAccount.bank ? `<div>Bank: ${selectedAccount.bank}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
};
