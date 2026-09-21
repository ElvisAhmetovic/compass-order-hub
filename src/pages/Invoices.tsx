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
import { PlusCircle, FileEdit, Trash2, Download, File, CheckCircle2, XCircle, Send, Eye, Receipt, ArrowUpDown, Bell, Timer, TimerOff, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { nextReminderForInvoice } from "@/utils/reminderInterval";
import { getOutstandingAmount, getPaidAmount } from "@/utils/invoiceBalance";

const PAGE_SIZE = 25;

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
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(filterText), 250);
    return () => clearTimeout(timer);
  }, [filterText]);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  // Selected month for "Paid" card (format: YYYY-MM, default = current month)
  const [selectedPaidMonth, setSelectedPaidMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
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
      // Partially paid invoices keep being chased for the remaining balance.
      if (['paid', 'cancelled', 'refunded', 'draft'].includes(newStatus)) {
        updateData.next_reminder_at = null; // Stop reminders
      } else if (newStatus === 'sent' || newStatus === 'overdue' || newStatus === 'partially_paid') {
        // Only set next_reminder_at if not already set
        const currentInvoice = invoices.find(inv => inv.id === id);
        if (!(currentInvoice as any)?.next_reminder_at) {
          updateData.next_reminder_at = await nextReminderForInvoice(id);
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

  const getDateSearchText = (dateValue?: string) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue.toLowerCase();

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return [
      dateValue,
      `${day}/${month}/${year}`,
      `${day}.${month}.${year}`,
      `${year}-${month}-${day}`,
      date.toLocaleDateString(),
    ].join(' ').toLowerCase();
  };

  // Build a searchable text blob per invoice once, instead of on every keystroke
  const searchIndex = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach(invoice => {
      const linkedOrder = (invoice as any).order;
      map.set(
        invoice.id,
        [
          invoice.invoice_number,
          invoice.bill_to_name || invoice.client?.name,
          invoice.bill_to_email || invoice.client?.email,
          invoice.client?.contact_person,
          invoice.status,
          invoice.currency,
          invoice.total_amount?.toString(),
          invoice.notes,
          (invoice as any).order_id,
          linkedOrder?.company_name,
          linkedOrder?.contact_email,
          linkedOrder?.assigned_to_name,
          getDateSearchText(linkedOrder?.created_at),
          getDateSearchText(invoice.issue_date),
          getDateSearchText(invoice.created_at),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
      );
    });
    return map;
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const search = debouncedFilter.trim().toLowerCase();
    if (!search) return invoices;
    return invoices.filter(invoice => (searchIndex.get(invoice.id) || '').includes(search));
  }, [invoices, searchIndex, debouncedFilter]);

  const getInvoiceCreatedTime = (invoice: Invoice) => {
    const createdTime = new Date(invoice.created_at).getTime();
    return Number.isNaN(createdTime) ? new Date(invoice.issue_date).getTime() : createdTime;
  };

  const dateRange = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (periodFilter) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'this-week': {
        const day = (now.getDay() + 6) % 7; // Monday = 0
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
        return { from: startOfDay(monday), to: endOfDay(sunday) };
      }
      case 'this-month':
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
        };
      case 'last-month':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
        };
      case 'this-year':
        return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(new Date(now.getFullYear(), 11, 31)) };
      case 'last-year':
        return { from: new Date(now.getFullYear() - 1, 0, 1), to: endOfDay(new Date(now.getFullYear() - 1, 11, 31)) };
      case 'custom':
        return {
          from: customFrom ? startOfDay(customFrom) : null,
          to: customTo ? endOfDay(customTo) : null,
        };
      default: {
        if (periodFilter.startsWith('month:')) {
          const [year, month] = periodFilter.slice(6).split('-').map(Number);
          if (year && month) {
            return {
              from: new Date(year, month - 1, 1),
              to: endOfDay(new Date(year, month, 0)),
            };
          }
        }
        return { from: null as Date | null, to: null as Date | null };
      }
    }
  }, [periodFilter, customFrom, customTo]);

  const sortedInvoices = useMemo(() => {
    let result = [...filteredInvoices];

    if (statusFilter !== 'all') {
      result = result.filter(inv => inv.status === statusFilter);
    }

    if (dateRange.from || dateRange.to) {
      result = result.filter(inv => {
        const issued = new Date(inv.issue_date).getTime();
        if (Number.isNaN(issued)) return false;
        if (dateRange.from && issued < dateRange.from.getTime()) return false;
        if (dateRange.to && issued > dateRange.to.getTime()) return false;
        return true;
      });
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return getInvoiceCreatedTime(b) - getInvoiceCreatedTime(a);
        case 'oldest':
          return new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
        case 'inv-low':
          return a.invoice_number.localeCompare(b.invoice_number, undefined, { numeric: true });
        case 'inv-high':
          return b.invoice_number.localeCompare(a.invoice_number, undefined, { numeric: true });
        case 'a-z':
          return ((a.bill_to_name || a.client?.name) || '').localeCompare((b.bill_to_name || b.client?.name) || '');
        case 'z-a':
          return ((b.bill_to_name || b.client?.name) || '').localeCompare((a.bill_to_name || a.client?.name) || '');
        default:
          return 0;
      }
    });

    return result;
  }, [filteredInvoices, sortOption, statusFilter, dateRange]);

  const visibleTotal = useMemo(
    () => sortedInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    [sortedInvoices]
  );

  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedInvoices = useMemo(
    () => sortedInvoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedInvoices, currentPage]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedFilter, statusFilter, periodFilter, customFrom, customTo, sortOption]);

  const filtersActive = statusFilter !== 'all' || periodFilter !== 'all';

  const clearFilters = () => {
    setStatusFilter('all');
    setPeriodFilter('all');
    setCustomFrom(undefined);
    setCustomTo(undefined);
  };

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + getOutstandingAmount(inv), 0);

  // Build last 24 months options
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  const totalPaidThisMonth = invoices
    .filter(inv => {
      const issueDate = new Date(inv.issue_date);
      const key = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
      return inv.status === 'paid' && key === selectedPaidMonth;
    })
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  // Picking a month on the Paid card also drives the list below
  const handlePaidMonthChange = (value: string) => {
    setSelectedPaidMonth(value);
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setPeriodFilter(`month:${value}`);
    setStatusFilter('paid');
  };

  const activeRangeLabel = useMemo(() => {
    if (periodFilter.startsWith('month:')) {
      return monthOptions.find(o => o.value === periodFilter.slice(6))?.label || null;
    }
    if (periodFilter === 'custom' && (customFrom || customTo)) {
      return `${customFrom ? format(customFrom, 'dd.MM.yyyy') : '…'} → ${customTo ? format(customTo, 'dd.MM.yyyy') : '…'}`;
    }
    return null;
  }, [periodFilter, monthOptions, customFrom, customTo]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
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
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
                        <Select value={selectedPaidMonth} onValueChange={handlePaidMonthChange}>
                          <SelectTrigger className="h-7 w-[150px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle>Manage Invoices</CardTitle>
                        <div className="flex flex-wrap items-center gap-3">
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All statuses</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="partially_paid">Partially paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="w-[190px]">
                              <CalendarIcon className="h-4 w-4 mr-2 opacity-50" />
                              <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[320px]">
                              <SelectItem value="all">All time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="this-week">This week</SelectItem>
                              <SelectItem value="this-month">This month</SelectItem>
                              <SelectItem value="last-month">Last month</SelectItem>
                              <SelectItem value="this-year">This year</SelectItem>
                              <SelectItem value="last-year">Last year</SelectItem>
                              <SelectItem value="custom">Custom range</SelectItem>
                              <SelectSeparator />
                              <SelectGroup>
                                <SelectLabel>Specific month</SelectLabel>
                                {monthOptions.map(opt => (
                                  <SelectItem key={opt.value} value={`month:${opt.value}`}>{opt.label}</SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                          <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="w-[170px]">
                              <ArrowUpDown className="h-4 w-4 mr-2 opacity-50" />
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newest">Newest</SelectItem>
                              <SelectItem value="oldest">Oldest</SelectItem>
                              <SelectItem value="inv-low">Lowest INV #</SelectItem>
                              <SelectItem value="inv-high">Highest INV #</SelectItem>
                              <SelectItem value="a-z">A → Z</SelectItem>
                              <SelectItem value="z-a">Z → A</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="w-72">
                            <Input
                              placeholder="Search invoice #, client, order date, worker, amount..."
                              value={filterText}
                              onChange={(e) => setFilterText(e.target.value)}
                              className="max-w-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {periodFilter === 'custom' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !customFrom && "text-muted-foreground")}>
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {customFrom ? format(customFrom, "dd.MM.yyyy") : "From"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 overflow-hidden" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
                              <div className="h-[350px]">
                                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} showOutsideDays fixedWeeks initialFocus className={cn("p-3 pointer-events-auto")} />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <span className="text-muted-foreground text-sm">→</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !customTo && "text-muted-foreground")}>
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {customTo ? format(customTo, "dd.MM.yyyy") : "To"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 overflow-hidden" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
                              <div className="h-[350px]">
                                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} showOutsideDays fixedWeeks initialFocus className={cn("p-3 pointer-events-auto")} />
                              </div>
                            </PopoverContent>
                          </Popover>
                          {(customFrom || customTo) && (
                            <Button variant="ghost" size="sm" onClick={() => { setCustomFrom(undefined); setCustomTo(undefined); }}>
                              Clear dates
                            </Button>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Showing {sortedInvoices.length} of {invoices.length} invoices · Total €{visibleTotal.toFixed(2)}
                        </span>
                        {filtersActive && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Issue / Created</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Outstanding</TableHead>
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
                           <TableCell colSpan={9} className="text-center py-8">Loading invoices...</TableCell>
                          </TableRow>
                        ) : sortedInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">No invoices found</TableCell>
                          </TableRow>
                        ) : (
                          pagedInvoices.map((invoice) => (
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
                                  <div className="font-medium">{invoice.bill_to_name || invoice.client?.name}</div>
                                  <div className="text-sm text-gray-500">{invoice.bill_to_email || invoice.client?.email}</div>
                                  {(invoice as any).order?.created_at && (
                                    <div className="text-xs text-gray-500">
                                      Order {new Date((invoice as any).order.created_at).toLocaleDateString()}
                                      {(invoice as any).order?.assigned_to_name ? ` • ${(invoice as any).order.assigned_to_name}` : ''}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{new Date(invoice.issue_date).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500">
                                  Created {new Date(invoice.created_at).toLocaleDateString()} {new Date(invoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </TableCell>
                              <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {formatCurrency(invoice.total_amount, invoice.currency)}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const paid = getPaidAmount(invoice);
                                  const outstanding = getOutstandingAmount(invoice);
                                  if (outstanding <= 0) {
                                    return <span className="text-muted-foreground text-sm">—</span>;
                                  }
                                  return (
                                    <div>
                                      <div className="font-medium text-destructive">
                                        {formatCurrency(outstanding, invoice.currency)}
                                      </div>
                                      {paid > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                          paid {formatCurrency(paid, invoice.currency)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
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
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
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
