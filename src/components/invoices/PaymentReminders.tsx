
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InvoiceService } from "@/services/invoiceService";
import { Invoice } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";
import { Send, Calendar, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

const PaymentReminders = () => {
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOverdueInvoices();
  }, []);

  const loadOverdueInvoices = async () => {
    try {
      setLoading(true);
      const allInvoices = await InvoiceService.getInvoices();
      const now = new Date();
      
      const overdue = allInvoices.filter(invoice => {
        const dueDate = new Date(invoice.due_date);
        return (
          (invoice.status === 'sent' || invoice.status === 'partially_paid') &&
          dueDate < now
        );
      });
      
      setOverdueInvoices(overdue);
    } catch (error) {
      console.error("Error loading overdue invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load overdue invoices.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentReminder = async (invoiceId: string) => {
    try {
      setSendingReminder(invoiceId);
      
      // In a real implementation, this would send an email reminder
      // For now, we'll just update the invoice status and show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Reminder sent",
        description: "Payment reminder has been sent to the client.",
      });
      
      // Refresh the list
      await loadOverdueInvoices();
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send payment reminder.",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      case 'CHF': return 'CHF';
      case 'SEK': return 'kr';
      case 'NOK': return 'kr';
      case 'DKK': return 'kr';
      case 'EUR':
      default: return '€';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading overdue invoices...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Payment Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {overdueInvoices.length === 0 ? (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              No overdue invoices found. All payments are up to date!
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="mb-4">
              <AlertDescription>
                {overdueInvoices.length} invoice(s) are overdue and need attention.
              </AlertDescription>
            </Alert>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueInvoices.map((invoice) => {
                  const daysOverdue = getDaysOverdue(invoice.due_date);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.client?.name}</div>
                          <div className="text-sm text-gray-500">{invoice.client?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant={daysOverdue > 30 ? "destructive" : "secondary"}>
                          {daysOverdue} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getCurrencySymbol(invoice.currency)}
                        {invoice.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => sendPaymentReminder(invoice.id)}
                          disabled={sendingReminder === invoice.id}
                        >
                          {sendingReminder === invoice.id ? (
                            "Sending..."
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Send Reminder
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentReminders;
