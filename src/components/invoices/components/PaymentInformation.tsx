
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
  const allAccounts = PAYMENT_ACCOUNTS;
  const selectedAccounts = selectedPaymentAccount === "both"
    ? allAccounts.filter(acc => acc.id !== "uk")
    : allAccounts.filter(acc => acc.id === selectedPaymentAccount);

  const getPaymentTranslations = (language: string) => {
    const translations = {
      en: { paymentAccount: "Payment Account", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Account", bank: "Bank", bothAccounts: "All Accounts", sortCode: "Sort Code", accountNumber: "Account Number", address: "Address" },
      nl: { paymentAccount: "Betaalrekening", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Rekening", bank: "Bank", bothAccounts: "Alle rekeningen", sortCode: "Sorteercode", accountNumber: "Rekeningnummer", address: "Adres" },
      de: { paymentAccount: "Zahlungskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alle Konten", sortCode: "Bankleitzahl", accountNumber: "Kontonummer", address: "Adresse" },
      fr: { paymentAccount: "Compte de paiement", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Compte", bank: "Banque", bothAccounts: "Tous les comptes", sortCode: "Code guichet", accountNumber: "Numéro de compte", address: "Adresse" },
      es: { paymentAccount: "Cuenta de pago", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Cuenta", bank: "Banco", bothAccounts: "Todas las cuentas", sortCode: "Código de clasificación", accountNumber: "Número de cuenta", address: "Dirección" },
      da: { paymentAccount: "Betalingskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alle konti", sortCode: "Sorteringskode", accountNumber: "Kontonummer", address: "Adresse" },
      no: { paymentAccount: "Betalingskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alle kontoer", sortCode: "Sorteringskode", accountNumber: "Kontonummer", address: "Adresse" },
      cs: { paymentAccount: "Platební účet", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Účet", bank: "Banka", bothAccounts: "Všechny účty", sortCode: "Kód pobočky", accountNumber: "Číslo účtu", address: "Adresa" },
      pl: { paymentAccount: "Konto płatnicze", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Wszystkie konta", sortCode: "Kod oddziału", accountNumber: "Numer konta", address: "Adres" },
      sv: { paymentAccount: "Betalningskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alla konton", sortCode: "Clearingnummer", accountNumber: "Kontonummer", address: "Adress" }
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
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">🌍</Badge>
                  {paymentLabels.bothAccounts}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedAccounts.length > 0 && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            {selectedAccounts.map((account, idx) => (
              <div key={account.id} className={idx > 0 ? "pt-3 mt-3 border-t border-border" : ""}>
                <div className="font-semibold text-sm mb-2">{account.name}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>{paymentLabels.iban}:</strong> {account.iban}
                  </div>
                  <div>
                    <strong>{paymentLabels.bic}:</strong> {account.bic}
                  </div>
                  {account.blz && (
                    <div>
                      <strong>{paymentLabels.blz}:</strong> {account.blz}
                    </div>
                  )}
                  {account.account && (
                    <div>
                      <strong>{paymentLabels.account}:</strong> {account.account}
                    </div>
                  )}
                  {account.sortCode && (
                    <div>
                      <strong>{paymentLabels.sortCode}:</strong> {account.sortCode}
                    </div>
                  )}
                  {account.accountNumber && (
                    <div>
                      <strong>{paymentLabels.accountNumber}:</strong> {account.accountNumber}
                    </div>
                  )}
                  {account.bank && (
                    <div className="col-span-2">
                      <strong>{paymentLabels.bank}:</strong> {account.bank}
                    </div>
                  )}
                  {account.address && (
                    <div className="col-span-2">
                      <strong>{paymentLabels.address}:</strong> {account.address}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
