
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_ACCOUNTS, PAYMENT_ACCOUNT_CHOICES, filterAccountsByChoice } from "../constants";
import { getPaymentPanelLabels } from "../invoiceTranslations";

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
  const choice = selectedPaymentAccount === "germany" || selectedPaymentAccount === "revolut" ? selectedPaymentAccount : "all";
  const selectedAccounts = filterAccountsByChoice(PAYMENT_ACCOUNTS, choice);

  const paymentLabels = getPaymentPanelLabels(language);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{paymentLabels.paymentAccount}</Label>
          <Select value={choice} onValueChange={onPaymentAccountChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_ACCOUNT_CHOICES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAccounts.length > 0 && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            {selectedAccounts.map((account, idx) => (
              <div key={account.id} className={idx > 0 ? "pt-3 mt-3 border-t border-border" : ""}>
                <div className="font-semibold text-sm mb-2">{account.name}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {account.accountHolder && (
                    <div className="col-span-2">
                      <strong>Account Holder:</strong> {account.accountHolder}
                    </div>
                  )}
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
