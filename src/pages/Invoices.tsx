import React, { useState, useEffect } from "react";
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
import { PlusCircle, FileEdit, Trash2, Download, File, CheckCircle2, XCircle, Send, Eye, Receipt } from "lucide-react";
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
import PaymentReminders from "@/components/invoices/PaymentReminders";
import { formatCurrency } from "@/utils/currencyUtils";

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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Create a partial invoice update with just the status
      const updateData = { 
        status: newStatus as Invoice['status']
      };
      
      await InvoiceService.updateInvoice(id, updateData);
      setInvoices(invoices.map(invoice => 
        invoice.id === id ? { ...invoice, status: newStatus as Invoice['status'] } : invoice
      ));
      
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

  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoice_number.toLowerCase().includes(filterText.toLowerCase()) ||
    invoice.client?.name.toLowerCase().includes(filterText.toLowerCase()) ||
    invoice.client?.email.toLowerCase().includes(filterText.toLowerCase())
  );

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
      <div className="flex-1">
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
                      <div className="w-72">
                        <Input
                          placeholder="Search invoices..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="max-w-sm"
                        />
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
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">Loading invoices...</TableCell>
                          </TableRow>
                        ) : filteredInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">No invoices found</TableCell>
                          </TableRow>
                        ) : (
                          filteredInvoices.map((invoice) => (
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
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    title="View/Edit"
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {/* TODO: Implement PDF download */}}
                                    title="Download PDF"
                                  >
                                    <Download size={16} />
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
