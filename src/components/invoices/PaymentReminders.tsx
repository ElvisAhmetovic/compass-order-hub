
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InvoiceService } from "@/services/invoiceService";
import { Invoice } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Send, Calendar, Mail, Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import EmailTemplateEditor from "./EmailTemplateEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PaymentReminders = () => {
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

  const sendPaymentReminder = async (invoiceId: string, subject: string, body: string) => {
    try {
      setSendingReminder(invoiceId);
      
      const invoice = overdueInvoices.find(inv => inv.id === invoiceId);
      if (!invoice || !invoice.client) {
        throw new Error("Invoice or client information not found");
      }

      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          to: invoice.client.email,
          subject,
          body,
          invoiceId: invoice.id,
          clientName: invoice.client.name
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email sent successfully",
        description: `Payment reminder sent to ${invoice.client.name}`,
      });

      // Close the expanded editor
      setExpandedRow(null);
      
      // Refresh the list
      await loadOverdueInvoices();
    } catch (error: any) {
      console.error("Error sending payment reminder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send payment reminder.",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      setDeletingInvoice(invoiceId);
      
      await InvoiceService.deleteInvoice(invoiceId);
      
      // Remove from local state
      setOverdueInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      
      toast({
        title: "Invoice deleted",
        description: "The invoice has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice.",
        variant: "destructive",
      });
    } finally {
      setDeletingInvoice(null);
    }
  };

  const toggleExpandRow = (invoiceId: string) => {
    setExpandedRow(expandedRow === invoiceId ? null : invoiceId);
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

  // Check if user can delete invoices (admin or owner)
  const canDeleteInvoice = (invoice: Invoice) => {
    return user?.role === 'admin' || invoice.user_id === user?.id;
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
            
            <div className="space-y-2">
              {overdueInvoices.map((invoice) => {
                const daysOverdue = getDaysOverdue(invoice.due_date);
                const canDelete = canDeleteInvoice(invoice);
                const isExpanded = expandedRow === invoice.id;
                
                return (
                  <div key={invoice.id} className="border rounded-lg">
                    {/* Main Row */}
                    <div className="p-4">
                      <div className="grid grid-cols-7 gap-4 items-center">
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div>
                          <div className="font-medium">{invoice.client?.name}</div>
                          <div className="text-sm text-gray-500">{invoice.client?.email}</div>
                        </div>
                        <div>{formatDate(invoice.due_date)}</div>
                        <div>
                          <Badge variant={daysOverdue > 30 ? "destructive" : "secondary"}>
                            {daysOverdue} days
                          </Badge>
                        </div>
                        <div>
                          {getCurrencySymbol(invoice.currency)}
                          {invoice.total_amount.toFixed(2)}
                        </div>
                        <div>
                          <Badge variant="outline">{invoice.status}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={isExpanded ? "secondary" : "default"}
                            onClick={() => toggleExpandRow(invoice.id)}
                            disabled={sendingReminder === invoice.id}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Close
                              </>
                            ) : (
                              <>
                                <Edit className="h-4 w-4 mr-1" />
                                Send Reminder
                              </>
                            )}
                          </Button>
                          
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deletingInvoice === invoice.id}
                                >
                                  {deletingInvoice === invoice.id ? (
                                    "Deleting..."
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invoice {invoice.invoice_number}? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteInvoice(invoice.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Invoice
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Email Editor */}
                    {isExpanded && (
                      <div className="border-t p-4 bg-gray-50">
                        <EmailTemplateEditor
                          invoiceData={{
                            clientName: invoice.client?.name || '',
                            invoiceNumber: invoice.invoice_number,
                            amount: `${getCurrencySymbol(invoice.currency)}${invoice.total_amount.toFixed(2)}`,
                            dueDate: formatDate(invoice.due_date),
                            daysOverdue: daysOverdue
                          }}
                          onSendEmail={(subject, body) => sendPaymentReminder(invoice.id, subject, body)}
                          onCancel={() => setExpandedRow(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentReminders;
