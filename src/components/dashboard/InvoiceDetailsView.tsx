
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order, InvoiceDetails } from "@/types";
import { formatDate } from "@/lib/utils";

interface InvoiceDetailsViewProps {
  order: Order;
}

const InvoiceDetailsView = ({ order }: InvoiceDetailsViewProps) => {
  // Mock invoice details if not available
  const invoiceDetails = order.invoice_details || {
    invoice_number: `INV-${order.id.substring(0, 6)}`,
    transaction_id: `${Math.floor(Math.random() * 900000000) + 100000000}`,
    transaction_date: order.updated_at,
    account_number: `SI${Math.floor(Math.random() * 900000000) + 100000000}`,
    reference_number: `${Math.floor(Math.random() * 9000000) + 1000000}`,
    bank_details: "SPARKASSE BANK DD BIH",
    posting_date: order.updated_at,
    value_date: new Date(new Date(order.updated_at).getTime() + 86400000).toISOString(),
    elba_reference: `ELBA.${Math.floor(Math.random() * 9000000) + 1000000}`,
  };
  
  const isInvoicePaid = order.status === 'Invoice Paid';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Invoice Details</h3>
        <Badge className={isInvoicePaid ? "bg-green-100 text-green-800 border border-green-200" : "bg-purple-100 text-purple-800 border border-purple-200"}>
          {order.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Transaction Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Transaction ID:</TableCell>
                  <TableCell>{invoiceDetails.transaction_id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Invoice Number:</TableCell>
                  <TableCell>{invoiceDetails.invoice_number}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Transaction Date:</TableCell>
                  <TableCell>{formatDate(invoiceDetails.transaction_date)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Amount:</TableCell>
                  <TableCell className="text-right font-medium">{order.price.toFixed(2)} EUR</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Account Number:</TableCell>
                  <TableCell>{invoiceDetails.account_number}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bank:</TableCell>
                  <TableCell>{invoiceDetails.bank_details}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Reference:</TableCell>
                  <TableCell>{invoiceDetails.reference_number || "-"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ELBA Reference:</TableCell>
                  <TableCell>{invoiceDetails.elba_reference || "-"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Recipient / Sender</TableHead>
                <TableHead>Value Date</TableHead>
                <TableHead>Posting Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{order.description}</TableCell>
                <TableCell>{order.company_name}</TableCell>
                <TableCell>{formatDate(invoiceDetails.value_date || order.updated_at)}</TableCell>
                <TableCell>{formatDate(invoiceDetails.posting_date || order.updated_at)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetailsView;
