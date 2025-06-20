
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_ACCOUNTS } from "../constants";

interface PaymentInformationProps {
  selectedPaymentAccount: string;
  language: string;
  onPaymentAccountChange: (accountId: string) => void;
}

export const PaymentInformation: React.FC<PaymentInformationProps> = ({
  selectedPaymentAccount,
  language,
  onPaymentAccountChange
}) => {
  const selectedAccount = PAYMENT_ACCOUNTS.find(acc => acc.id === selectedPaymentAccount);

  const getPaymentTranslations = (language: string) => {
    const translations = {
      en: { paymentAccount: "Payment Account", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Account", bank: "Bank" },
      nl: { paymentAccount: "Betaalrekening", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Rekening", bank: "Bank" },
      de: { paymentAccount: "Zahlungskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank" },
      fr: { paymentAccount: "Compte de paiement", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Compte", bank: "Banque" },
      es: { paymentAccount: "Cuenta de pago", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Cuenta", bank: "Banco" },
      da: { paymentAccount: "Betalingskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank" },
      no: { paymentAccount: "Betalingskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank" },
      cs: { paymentAccount: "Platební účet", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Účet", bank: "Banka" },
      pl: { paymentAccount: "Konto płatnicze", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank" },
      sv: { paymentAccount: "Betalningskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank" }
    };
    
    return translations[language] || translations.en;
  };

  const paymentLabels = getPaymentTranslations(language);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{paymentLabels.paymentAccount}</Label>
          <Select value={selectedPaymentAccount} onValueChange={onPaymentAccountChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_ACCOUNTS.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{account.country}</Badge>
                    {account.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAccount && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>{paymentLabels.iban}:</strong> {selectedAccount.iban}
              </div>
              <div>
                <strong>{paymentLabels.bic}:</strong> {selectedAccount.bic}
              </div>
              {selectedAccount.blz && (
                <div>
                  <strong>{paymentLabels.blz}:</strong> {selectedAccount.blz}
                </div>
              )}
              {selectedAccount.account && (
                <div>
                  <strong>{paymentLabels.account}:</strong> {selectedAccount.account}
                </div>
              )}
              {selectedAccount.bank && (
                <div className="col-span-2">
                  <strong>{paymentLabels.bank}:</strong> {selectedAccount.bank}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
