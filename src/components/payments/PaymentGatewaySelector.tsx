
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, Shield } from "lucide-react";
import { formatCurrency } from "@/utils/currencyUtils";

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'bank_transfer';
  enabled: boolean;
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
}

interface PaymentGatewaySelectorProps {
  amount: number;
  currency: string;
  onPaymentSelect: (gateway: PaymentGateway) => void;
  gateways?: PaymentGateway[];
}

const DEFAULT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    type: 'stripe',
    enabled: true,
    fees: { percentage: 2.9, fixed: 0.30, currency: 'USD' }
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'paypal',
    enabled: true,
    fees: { percentage: 3.4, fixed: 0.30, currency: 'USD' }
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank_transfer',
    enabled: true,
    fees: { percentage: 0, fixed: 0, currency: 'USD' }
  }
];

const PaymentGatewaySelector: React.FC<PaymentGatewaySelectorProps> = ({
  amount,
  currency,
  onPaymentSelect,
  gateways = DEFAULT_GATEWAYS
}) => {
  const [selectedGateway, setSelectedGateway] = useState<string>('');

  const calculateFees = (gateway: PaymentGateway) => {
    const percentageFee = (amount * gateway.fees.percentage) / 100;
    const totalFee = percentageFee + gateway.fees.fixed;
    return totalFee;
  };

  const getGatewayIcon = (type: string) => {
    switch (type) {
      case 'stripe':
      case 'paypal':
        return <CreditCard className="h-5 w-5" />;
      case 'bank_transfer':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const handlePayment = () => {
    const gateway = gateways.find(g => g.id === selectedGateway);
    if (gateway) {
      onPaymentSelect(gateway);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select Payment Gateway
          </label>
          <Select value={selectedGateway} onValueChange={setSelectedGateway}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a payment method" />
            </SelectTrigger>
            <SelectContent>
              {gateways.filter(g => g.enabled).map((gateway) => (
                <SelectItem key={gateway.id} value={gateway.id}>
                  <div className="flex items-center gap-2">
                    {getGatewayIcon(gateway.type)}
                    {gateway.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGateway && (
          <div className="space-y-3">
            {gateways
              .filter(g => g.id === selectedGateway)
              .map((gateway) => {
                const fees = calculateFees(gateway);
                const total = amount + fees;
                
                return (
                  <div key={gateway.id} className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{gateway.name}</span>
                      <Badge variant="outline">
                        {gateway.fees.percentage}% + {formatCurrency(gateway.fees.fixed, gateway.fees.currency)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>{formatCurrency(amount, currency)}</span>
                      </div>
                      {fees > 0 && (
                        <div className="flex justify-between">
                          <span>Processing Fee:</span>
                          <span>{formatCurrency(fees, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Total:</span>
                        <span>{formatCurrency(total, currency)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <Button 
          onClick={handlePayment}
          disabled={!selectedGateway}
          className="w-full"
        >
          Proceed with Payment
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentGatewaySelector;
