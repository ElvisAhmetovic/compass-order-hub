
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currencyUtils";
import { Invoice, InvoiceLineItem, Client } from "@/types/invoice";

interface InvoicePreviewProps {
  invoice?: Invoice;
  lineItems: InvoiceLineItem[];
  client?: Client;
  templateSettings: any;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  lineItems,
  client,
  templateSettings
}) => {
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
      }
    };
    
    const lang = templateSettings.language || 'en';
    return translations[lang]?.[key] || translations.en[key];
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-8">
        <div className="bg-white min-h-[800px] space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {templateSettings.logo && (
                <img 
                  src={templateSettings.logo} 
                  alt="Company Logo" 
                  className={`${
                    templateSettings.logoSize === "small" ? "h-12" :
                    templateSettings.logoSize === "medium" ? "h-16" :
                    "h-20"
                  } w-auto object-contain`}
                />
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {templateSettings.companyInfo.name}
                </h1>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-600">
                {templateSettings.invoiceNumberPrefix}{invoice?.invoice_number || "784/25"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                # {templateSettings.invoiceNumberPrefix}{invoice?.invoice_number || "784/25"}
              </p>
            </div>
          </div>

          {/* Company Details and Invoice Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="font-bold">{templateSettings.companyInfo.name}</div>
                <div>Company Registration Number: {templateSettings.companyInfo.registrationNumber}</div>
                <div>UID- Number: {templateSettings.companyInfo.vatId}</div>
                <div>{templateSettings.companyInfo.street} {templateSettings.companyInfo.postal} {templateSettings.companyInfo.city}</div>
                <div>{templateSettings.companyInfo.email}</div>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex justify-between">
                <span>{getTranslatedText('date')}</span>
                <span>{invoice?.issue_date ? formatDate(invoice.issue_date) : formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span>{getTranslatedText('dueDate')}</span>
                <span>{invoice?.due_date ? formatDate(invoice.due_date) : formatDate(new Date(Date.now() + 4*24*60*60*1000).toISOString())}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>{getTranslatedText('balanceDue')}</span>
                <span>{formatCurrency(total, templateSettings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <div className="font-bold text-gray-700 mb-2">{getTranslatedText('billTo')}</div>
            <div className="text-sm text-gray-700 space-y-1">
              {client ? (
                <>
                  <div className="font-bold">{client.name}</div>
                  <div>{client.email}</div>
                  {client.address && <div>{client.address}</div>}
                  {client.city && <div>{client.zip_code} {client.city}</div>}
                  {client.country && <div>{client.country}</div>}
                </>
              ) : (
                <>
                  <div className="font-bold">Client Name</div>
                  <div>client@email.com</div>
                  <div>Client Address</div>
                  <div>City, Country</div>
                </>
              )}
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="mt-8">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left py-3 px-4">{getTranslatedText('item')}</th>
                  <th className="text-center py-3 px-4">{getTranslatedText('quantity')}</th>
                  <th className="text-right py-3 px-4">{getTranslatedText('rate')}</th>
                  <th className="text-right py-3 px-4">{getTranslatedText('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">{item.item_description}</td>
                    <td className="text-center py-3 px-4">{item.quantity}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(item.unit_price, templateSettings.currency)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(item.quantity * item.unit_price * (1 - item.discount_rate), templateSettings.currency)}</td>
                  </tr>
                )) : (
                  <tr className="border-b">
                    <td className="py-3 px-4">Sample Service</td>
                    <td className="text-center py-3 px-4">1</td>
                    <td className="text-right py-3 px-4">{formatCurrency(750, templateSettings.currency)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(750, templateSettings.currency)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>{getTranslatedText('subtotal')}</span>
                <span>{formatCurrency(subtotal || 750, templateSettings.currency)}</span>
              </div>
              {templateSettings.vatEnabled && (
                <div className="flex justify-between">
                  <span>{getTranslatedText('tax')} ({templateSettings.vatRate}%):</span>
                  <span>{formatCurrency(vatAmount, templateSettings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{getTranslatedText('total')}</span>
                <span>{formatCurrency(total || 750, templateSettings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="mt-8 space-y-4">
            <div>
              <div className="font-bold text-gray-700 mb-2">{getTranslatedText('notes')}</div>
              <div className="text-sm text-gray-600">
                {templateSettings.customTerms || 
                 "We verzoeken dat de door ons gefactureerde diensten binnen 3 dagen worden gecrediteerd/overgemaakt. Alle belastingen en sociale premies worden door ons aangegeven en afgedragen aan de autoriteiten."}
              </div>
            </div>
            
            <div>
              <div className="font-bold text-gray-700 mb-2">{getTranslatedText('terms')}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{selectedAccount.name}:</div>
                <div>IBAN: {selectedAccount.iban}</div>
                <div>BIC: {selectedAccount.bic}</div>
                {selectedAccount.blz && <div>BLZ: {selectedAccount.blz} KONTO: {selectedAccount.account}</div>}
                {selectedAccount.bank && <div>Bank: {selectedAccount.bank}</div>}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
