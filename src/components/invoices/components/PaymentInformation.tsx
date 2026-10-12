
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { isValidPaymentLink } from "../stripePaymentLink";
import { PAYMENT_ACCOUNTS, PAYMENT_ACCOUNT_OPTIONS, filterAccountsByChoice, normalizePaymentAccountIds } from "../constants";
import { getPaymentPanelLabels } from "../invoiceTranslations";

interface PaymentInformationProps {
  selectedPaymentAccount: unknown;
  language: string;
  onPaymentAccountChange: (accountIds: string[]) => void;
  stripePaymentLink?: string;
  onStripePaymentLinkChange?: (value: string) => void;
}

export const PaymentInformation: React.FC<PaymentInformationProps> = ({
  selectedPaymentAccount,
  language,
  onPaymentAccountChange,
  stripePaymentLink,
  onStripePaymentLinkChange
}) => {
  const selectedIds = normalizePaymentAccountIds(selectedPaymentAccount);
  const selectedAccounts = filterAccountsByChoice(PAYMENT_ACCOUNTS, selectedIds);
  const toggle = (id: string, checked: boolean) => {
    const next = checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id);
    if (next.length === 0) return; // at least one account must stay selected
    onPaymentAccountChange(PAYMENT_ACCOUNT_OPTIONS.map((o) => o.id).filter((x) => next.includes(x)));
  };

  const paymentLabels = getPaymentPanelLabels(language);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{paymentLabels.paymentAccount}</Label>
          <div className="mt-2 space-y-2">
            {PAYMENT_ACCOUNT_OPTIONS.map((option) => {
              const checked = selectedIds.includes(option.id);
              return (
                <label key={option.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={checked}
                    disabled={checked && selectedIds.length === 1}
                    onCheckedChange={(v) => toggle(option.id, v === true)}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </div>

        {onStripePaymentLinkChange && (
          <div>
            <Label htmlFor="stripe_payment_link">Stripe payment link (optional, this invoice only)</Label>
            <Input
              id="stripe_payment_link"
              type="url"
              className="mt-2"
              placeholder="https://buy.stripe.com/..."
              value={stripePaymentLink || ''}
              onChange={(e) => onStripePaymentLinkChange(e.target.value)}
            />
            {stripePaymentLink && !isValidPaymentLink(stripePaymentLink) ? (
              <p className="mt-1 text-xs text-destructive">Please enter a full link starting with https://</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Shown as a "Pay online with Stripe" button on the preview, PDF and email. Saved with Save Invoice.</p>
            )}
          </div>
        )}

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
