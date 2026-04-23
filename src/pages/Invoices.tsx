import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Invoice } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileEdit, Trash2, Download, File, CheckCircle2, XCircle, Send, Eye, Receipt, ArrowUpDown, Bell, Timer, TimerOff, Loader2 } from "lucide-react";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { InvoiceService } from "@/services/invoiceService";
import { OrderService } from "@/services/orderService";
import PaymentReminders from "@/components/invoices/PaymentReminders";
import { formatCurrency } from "@/utils/currencyUtils";
import InvoiceReminderHistory from "@/components/invoices/InvoiceReminderHistory";
import { supabase } from "@/integrations/supabase/client";

const INVOICE_STATUSES = [
  "draft",
  "sent", 
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
  "refunded"
];

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Calculate overdue invoices
  const overdueInvoices = invoices.filter(invoice => {
    const dueDate = new Date(invoice.due_date);
    const now = new Date();
    return (
      (invoice.status === 'sent' || invoice.status === 'partially_paid') &&
      dueDate < now
    );
  });

  const overdueCount = overdueInvoices.length;
  
  // Play notification sound when there are overdue invoices (only on initial load)
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  useNotificationSound(overdueCount > 0 && !loading && !hasPlayedSound);

  useEffect(() => {
    if (overdueCount > 0 && !loading && !hasPlayedSound) {
      setHasPlayedSound(true);
    }
  }, [overdueCount, loading, hasPlayedSound]);
  
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await InvoiceService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDeleteInvoice = async (id: string) => {
    try {
      await InvoiceService.deleteInvoice(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
      
      toast({
        title: "Invoice deleted",
        description: "Invoice has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice.",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = () => {
    navigate("/invoices/new");
  };

  const handleDownloadInvoicePDF = async (invoice: Invoice) => {
    if (downloadingId) return;
    setDownloadingId(invoice.id);
    try {
      const [lineItems, client] = await Promise.all([
        InvoiceService.getLineItems(invoice.id),
        invoice.client_id ? InvoiceService.getClient(invoice.client_id) : Promise.resolve(null),
      ]);

      // Load template settings from localStorage (same source as InvoiceDetail)
      let templateSettings: any = {};
      try {
        const saved = localStorage.getItem('invoiceTemplateSettings');
        if (saved) templateSettings = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse invoiceTemplateSettings:', e);
      }

      await generateInvoicePDF({
        invoice,
        lineItems,
        client: client || undefined,
        templateSettings: {
          ...templateSettings,
          currency: invoice.currency,
        },
        formData: { currency: invoice.currency },
      });

      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleRemindersPaused = async (invoice: Invoice) => {
    const newPaused = !invoice.reminders_paused;
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ reminders_paused: newPaused })
        .eq('id', invoice.id);
      
      if (error) throw error;
      
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id ? { ...inv, reminders_paused: newPaused } : inv
      ));
      
      toast({
        title: newPaused ? "Reminders paused" : "Reminders resumed",
        description: newPaused 
          ? `Automated reminders paused for ${invoice.invoice_number}` 
          : `Automated reminders resumed for ${invoice.invoice_number}`,
      });
    } catch (error) {
      console.error("Error toggling reminders:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder settings.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Create update data with status + reminder scheduling
      const updateData: any = { 
        status: newStatus as Invoice['status']
      };
      
      // Auto-manage reminder scheduling based on status
      if (['paid', 'cancelled', 'refunded', 'draft', 'partially_paid'].includes(newStatus)) {
        updateData.next_reminder_at = null; // Stop reminders
      } else if (newStatus === 'sent' || newStatus === 'overdue') {
        // Only set next_reminder_at if not already set
        const currentInvoice = invoices.find(inv => inv.id === id);
        if (!(currentInvoice as any)?.next_reminder_at) {
          updateData.next_reminder_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        }
      }
      
      await InvoiceService.updateInvoice(id, updateData);
      setInvoices(invoices.map(invoice => 
        invoice.id === id ? { ...invoice, status: newStatus as Invoice['status'] } : invoice
      ));

      // Sync status to linked order
      const currentInvoice = invoices.find(inv => inv.id === id);
      const orderId = (currentInvoice as any)?.order_id;
      if (orderId) {
        try {
          if (newStatus === 'sent') {
            await OrderService.toggleOrderStatus(orderId, "Invoice Sent", true);
          } else if (newStatus === 'paid') {
            await OrderService.toggleOrderStatus(orderId, "Invoice Paid", true);
          } else if (newStatus === 'draft' || newStatus === 'cancelled') {
            await OrderService.toggleOrderStatus(orderId, "Invoice Sent", false);
            await OrderService.toggleOrderStatus(orderId, "Invoice Paid", false);
          }
        } catch (err) {
          console.error("Error syncing invoice status to order:", err);
        }
      }

      // Sync status to linked monthly installment
      try {
        const { data: linkedInstallment } = await supabase
          .from('monthly_installments')
          .select('id')
          .eq('invoice_id', id)
          .maybeSingle();

        if (linkedInstallment) {
          const installmentUpdate: Record<string, any> = {};
          if (newStatus === 'paid') {
            installmentUpdate.payment_status = 'paid';
            installmentUpdate.paid_at = new Date().toISOString();
          } else if (newStatus === 'sent') {
            installmentUpdate.payment_status = 'unpaid';
            installmentUpdate.paid_at = null;
            installmentUpdate.email_sent = true;
            installmentUpdate.email_sent_at = new Date().toISOString();
          } else if (newStatus === 'draft' || newStatus === 'cancelled') {
            installmentUpdate.payment_status = 'unpaid';
            installmentUpdate.paid_at = null;
            installmentUpdate.email_sent = false;
            installmentUpdate.email_sent_at = null;
          }
          if (Object.keys(installmentUpdate).length > 0) {
            await supabase.from('monthly_installments').update(installmentUpdate).eq('id', linkedInstallment.id);
          }
        }
      } catch (err) {
        console.error("Error syncing invoice status to monthly installment:", err);
      }

      toast({
        title: "Status updated",
        description: `Invoice status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice status.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 size={14} className="mr-1.5 text-green-600" />;
      case "cancelled":
      case "refunded":
        return <XCircle size={14} className="mr-1.5 text-red-600" />;
      case "sent":
        return <Send size={14} className="mr-1.5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "partially_paid":
        return "bg-orange-100 text-orange-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const search = filterText.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(search) ||
      invoice.client?.name?.toLowerCase().includes(search) ||
      invoice.client?.email?.toLowerCase().includes(search) ||
      invoice.client?.contact_person?.toLowerCase().includes(search) ||
      invoice.status.toLowerCase().includes(search) ||
      invoice.currency?.toLowerCase().includes(search) ||
      invoice.total_amount?.toString().includes(search) ||
      invoice.notes?.toLowerCase().includes(search)
    );
  });

  const sortedInvoices = useMemo(() => {
    let result = [...filteredInvoices];

    // Status filters
    if (['sent', 'draft', 'paid'].includes(sortOption)) {
      result = result.filter(inv => inv.status === sortOption);
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
        case 'sent':
        case 'draft':
        case 'paid':
          return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
        case 'oldest':
          return new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
        case 'inv-low':
          return a.invoice_number.localeCompare(b.invoice_number, undefined, { numeric: true });
        case 'inv-high':
          return b.invoice_number.localeCompare(a.invoice_number, undefined, { numeric: true });
        case 'a-z':
          return (a.client?.name || '').localeCompare(b.client?.name || '');
        case 'z-a':
          return (b.client?.name || '').localeCompare(a.client?.name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [filteredInvoices, sortOption]);

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const totalPaidThisMonth = invoices
    .filter(inv => {
      const issueDate = new Date(inv.issue_date);
      const now = new Date();
      return inv.status === 'paid' && 
        issueDate.getMonth() === now.getMonth() && 
        issueDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Invoices</h1>
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {overdueCount} overdue
                  </Badge>
                )}
              </div>
              <Button onClick={handleCreateInvoice} className="flex items-center gap-2">
                <PlusCircle size={16} />
                Create Invoice
              </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reminders" className="relative">
                  Payment Reminders
                  {overdueCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {overdueCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">€{totalOutstanding.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Paid This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">€{totalPaidThisMonth.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{invoices.length}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                      <CardTitle>Manage Invoices</CardTitle>
                      <div className="flex items-center gap-3">
                        <Select value={sortOption} onValueChange={setSortOption}>
                          <SelectTrigger className="w-[180px]">
                            <ArrowUpDown className="h-4 w-4 mr-2 opacity-50" />
                            <SelectValue placeholder="Sort by..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="oldest">Oldest</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="inv-low">Lowest INV #</SelectItem>
                            <SelectItem value="inv-high">Highest INV #</SelectItem>
                            <SelectItem value="a-z">A → Z</SelectItem>
                            <SelectItem value="z-a">Z → A</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="w-72">
                          <Input
                            placeholder="Search by invoice #, client, status, amount..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="max-w-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center justify-center"><Bell size={14} /></span>
                                </TooltipTrigger>
                                <TooltipContent>Auto Reminders</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                           <TableCell colSpan={8} className="text-center py-8">Loading invoices...</TableCell>
                          </TableRow>
                        ) : sortedInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">No invoices found</TableCell>
                          </TableRow>
                        ) : (
                          sortedInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Receipt size={16} className="text-gray-400" />
                                  <a 
                                    href={`/invoices/${invoice.id}`}
                                    className="text-primary hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(`/invoices/${invoice.id}`);
                                    }}
                                  >
                                    {invoice.invoice_number}
                                  </a>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{invoice.client?.name}</div>
                                  <div className="text-sm text-gray-500">{invoice.client?.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {formatCurrency(invoice.total_amount, invoice.currency)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                                      getStatusColor(invoice.status)}`}>
                                      {getStatusIcon(invoice.status)} {invoice.status.replace('_', ' ')}
                                    </span>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    {INVOICE_STATUSES.map((status) => (
                                      <DropdownMenuItem 
                                        key={status} 
                                        onClick={() => handleUpdateStatus(invoice.id, status)}
                                        className="cursor-pointer"
                                      >
                                        <span className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(status)}`} />
                                        {status.replace('_', ' ')}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            title={invoice.reminders_paused ? "Reminders paused – click to resume" : "Reminders active – click to pause"}
                                          >
                                            {invoice.reminders_paused ? (
                                              <TimerOff size={16} className="text-muted-foreground" />
                                            ) : (
                                              <Timer size={16} className="text-primary" />
                                            )}
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {invoice.reminders_paused ? "Reminders paused – click to resume" : "Reminders active – click to pause"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {invoice.reminders_paused ? "Resume Reminders" : "Pause Reminders"}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {invoice.reminders_paused
                                          ? `Are you sure you want to resume automatic payment reminders for invoice ${invoice.invoice_number}?`
                                          : `Are you sure you want to pause automatic payment reminders for invoice ${invoice.invoice_number}? No reminders will be sent until resumed.`}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleToggleRemindersPaused(invoice)}>
                                        {invoice.reminders_paused ? "Yes, Resume" : "Yes, Pause"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'refunded' && (
                                    <AlertDialog>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                title="Confirm Payment Received"
                                              >
                                                <CheckCircle2 size={16} />
                                              </Button>
                                            </AlertDialogTrigger>
                                          </TooltipTrigger>
                                          <TooltipContent>Confirm Payment Received</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirm Payment Received</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure the payment for invoice <strong>{invoice.invoice_number}</strong> has been received? This will mark the invoice as paid and send a confirmation email to the client.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={async () => {
                                              await handleUpdateStatus(invoice.id, 'paid');
                                              supabase.functions.invoke('send-payment-confirmation', {
                                                body: {
                                                  invoice_number: invoice.invoice_number,
                                                  client_name: invoice.client?.name || 'Client',
                                                  client_email: invoice.client?.email || '',
                                                  amount: invoice.total_amount,
                                                  currency: invoice.currency || 'EUR',
                                                },
                                              }).catch(err => console.error('Payment confirmation email error:', err));
                                              toast({
                                                title: "✅ Payment confirmed",
                                                description: `${invoice.invoice_number} marked as paid & notification sent`,
                                              });
                                            }}
                                          >
                                            Yes, Payment Received
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  <InvoiceReminderHistory invoice={invoice} />
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    title="View/Edit"
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        title="Delete"
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete invoice <strong>{invoice.invoice_number}</strong>? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive hover:bg-destructive/90"
                                          onClick={() => handleDeleteInvoice(invoice.id)}
                                        >
                                          Delete Invoice
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDownloadInvoicePDF(invoice)}
                                    disabled={downloadingId === invoice.id}
                                    title="Download PDF"
                                  >
                                    {downloadingId === invoice.id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Download size={16} />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reminders">
                <PaymentReminders />
              </TabsContent>
            </Tabs>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Invoices;
