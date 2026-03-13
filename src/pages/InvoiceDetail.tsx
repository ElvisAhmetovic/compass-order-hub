
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Invoice, Client, InvoiceLineItem, InvoiceFormData } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, ArrowLeft, Mail, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvoiceService } from "@/services/invoiceService";
import CurrencySelector from "@/components/invoices/CurrencySelector";
import { formatCurrency } from "@/utils/currencyUtils";
import LineItemRow from "@/components/invoices/LineItemRow";
import SendInvoiceDialog from "@/components/invoices/SendInvoiceDialog";

import InvoiceTemplateSettings from "@/components/invoices/InvoiceTemplateSettings";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import SendInvoicePDFDialog from "@/components/invoices/SendInvoicePDFDialog";

  // Reverse sync: update formData when currency changes in template settings
  useEffect(() => {
    if (templateSettings.currency && templateSettings.currency !== formData.currency) {
      setFormData(prev => ({ ...prev, currency: templateSettings.currency }));
    }
  }, [templateSettings.currency]);


const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isNewInvoice = id === 'new';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendPDFDialogOpen, setSendPDFDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [invoiceYear, setInvoiceYear] = useState<string>(new Date().getFullYear().toString());
  const [invoiceSeqNumber, setInvoiceSeqNumber] = useState<string>('');
  const [templateSettings, setTemplateSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('invoiceTemplateSettings');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {
      currency: 'EUR',
      vatEnabled: true,
      vatRate: 0,
      language: 'en',
      selectedPaymentAccount: 'both',
      invoiceNumberPrefix: 'INV-',
      companyInfo: {
        name: "Company Name",
        registrationNumber: "123456789",
        vatId: "VAT123456789",
        street: "Street Address",
        postal: "12345",
        city: "City",
        email: "info@company.com"
      }
    };
  });

  const [billToOverride, setBillToOverride] = useState({
    name: '', email: '', address: '', city: '', zip_code: '', country: ''
  });

  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'EUR',
    payment_terms: 'Net 30',
    notes: '',
    internal_notes: '',
    line_items: []
  });

  // Refs for auto-save
  const isDirty = useRef(false);
  const initialLoadDone = useRef(false);
  const formDataRef = useRef(formData);
  const lineItemsRef = useRef(lineItems);
  const billToOverrideRef = useRef(billToOverride);

  // Keep refs in sync
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { lineItemsRef.current = lineItems; }, [lineItems]);
  useEffect(() => { billToOverrideRef.current = billToOverride; }, [billToOverride]);

  // Mark dirty on changes (skip initial load)
  useEffect(() => {
    if (initialLoadDone.current) {
      isDirty.current = true;
    }
  }, [formData, lineItems, billToOverride]);

  useEffect(() => {
    loadData();
  }, [id]);

  // Update template settings when form currency changes
  useEffect(() => {
    setTemplateSettings(prev => ({
      ...prev,
      currency: formData.currency
    }));
  }, [formData.currency]);

  // Auto-save on unmount for existing invoices
  useEffect(() => {
    return () => {
      if (!isNewInvoice && id && isDirty.current) {
        const data = formDataRef.current;
        InvoiceService.updateInvoice(id, {
          client_id: data.client_id,
          issue_date: data.issue_date,
          due_date: data.due_date,
          currency: data.currency,
          payment_terms: data.payment_terms,
          notes: data.notes,
          internal_notes: data.internal_notes
        }).catch(err => console.error('Auto-save failed:', err));
      }
    };
  }, [id, isNewInvoice]);

  // Warn on browser tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current) { e.preventDefault(); }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Auto-fill billToOverride when client changes
  useEffect(() => {
    const client = clients.find(c => c.id === formData.client_id);
    if (client) {
      setBillToOverride({
        name: client.name || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        zip_code: client.zip_code || '',
        country: client.country || '',
      });
    }
  }, [formData.client_id, clients]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load clients
      const clientsData = await InvoiceService.getClients();
      setClients(clientsData);

      if (isNewInvoice) {
        // Pre-fill next invoice number
        const currentYear = new Date().getFullYear();
        const nextSeq = await InvoiceService.getNextSequenceNumber(currentYear);
        setInvoiceYear(currentYear.toString());
        setInvoiceSeqNumber(nextSeq.toString());
      } else if (!isNewInvoice && id) {
        // Load existing invoice
        const invoiceData = await InvoiceService.getInvoice(id);
        if (invoiceData) {
          setInvoice(invoiceData);
          
          // Parse year and sequence from invoice_number (format: INV-YYYY-NNN)
          const parts = invoiceData.invoice_number.split('-');
          if (parts.length >= 3) {
            setInvoiceYear(parts[1]);
            setInvoiceSeqNumber(parseInt(parts[2], 10).toString());
          }
          
          // Load line items first
          const lineItemsData = await InvoiceService.getLineItems(id);
          console.log('Loaded line items:', lineItemsData);
          setLineItems(lineItemsData);
          
          // Then set form data
          const newFormData = {
            client_id: invoiceData.client_id,
            issue_date: invoiceData.issue_date.split('T')[0],
            due_date: invoiceData.due_date.split('T')[0],
            currency: invoiceData.currency,
            payment_terms: invoiceData.payment_terms || 'Net 30',
            notes: invoiceData.notes || '',
            internal_notes: invoiceData.internal_notes || '',
            line_items: []
          };
          setFormData(newFormData);
          
          // Update template settings with invoice currency
          setTemplateSettings(prev => ({
            ...prev,
            currency: invoiceData.currency
          }));
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Mark initial load as done after a tick so the dirty tracking skips the initial state sets
      setTimeout(() => { initialLoadDone.current = true; }, 100);
    }
  };

  // Always ensure at least one line item exists
  useEffect(() => {
    if (!loading && lineItems.length === 0) {
      addLineItem();
    }
  }, [loading]);

  const handleFormDataChange = (field: string, value: any) => {
    console.log(`Updating form field: ${field} to:`, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `temp-${Date.now()}`,
      invoice_id: id || '',
      item_description: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      vat_rate: 0,
      discount_rate: 0,
      line_total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    console.log('=== UPDATE LINE ITEM START ===');
    console.log('Index:', index);
    console.log('Field:', field);
    console.log('Value:', value);
    console.log('Current lineItems length:', lineItems.length);
    console.log('Current item before update:', lineItems[index]);
    
    if (index < 0 || index >= lineItems.length) {
      console.error('Invalid index:', index);
      return;
    }
    
    // Use functional update to ensure we have the latest state
    setLineItems(prevItems => {
      const updated = [...prevItems];
      const currentItem = { ...updated[index] };
      
      console.log('Previous item:', currentItem);
      
      if (field === 'line_total') {
        // Reverse-calculate unit_price from brutto total
        const brutto = value as number;
        currentItem.line_total = brutto;
        const quantity = currentItem.quantity || 1;
        const discountMultiplier = 1 - currentItem.discount_rate;
        const vatMultiplier = 1 + currentItem.vat_rate;
        currentItem.unit_price = quantity > 0 && discountMultiplier > 0 && vatMultiplier > 0
          ? Math.round((brutto / quantity / discountMultiplier / vatMultiplier) * 100) / 100
          : 0;
        console.log('Reverse-calculated unit_price:', currentItem.unit_price);
      } else {
        // Update the specific field
        currentItem[field] = value;
        console.log('Updated field', field, 'to:', value);
        
        // Forward-calculate line total
        const subtotal = currentItem.quantity * currentItem.unit_price;
        const withDiscount = subtotal * (1 - currentItem.discount_rate);
        const withVat = withDiscount * (1 + currentItem.vat_rate);
        currentItem.line_total = Math.round(withVat * 100) / 100;
      }
      
      console.log('Calculated line total:', currentItem.line_total);
      console.log('Final updated item:', currentItem);
      
      updated[index] = currentItem;
      
      console.log('Final updated array length:', updated.length);
      console.log('=== UPDATE LINE ITEM END ===');
      
      return updated;
    });
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const netAmount = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price * (1 - item.discount_rate));
    }, 0);
    
    const vatAmount = lineItems.reduce((sum, item) => {
      const netItemAmount = item.quantity * item.unit_price * (1 - item.discount_rate);
      return sum + (netItemAmount * item.vat_rate);
    }, 0);
    
    const totalAmount = netAmount + vatAmount;
    
    return { netAmount, vatAmount, totalAmount };
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to save invoices.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.client_id) {
        toast({
          title: "Validation Error",
          description: "Please select a client.",
          variant: "destructive",
        });
        return;
      }

      console.log('Saving invoice with data:', formData);

      // Persist template settings to localStorage
      try {
        localStorage.setItem('invoiceTemplateSettings', JSON.stringify(templateSettings));
      } catch (e) {
        console.warn('Error saving template settings:', e);
      }

      if (isNewInvoice) {
        const lineItemsForCreation = lineItems.map(item => ({
          item_description: item.item_description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          discount_rate: item.discount_rate
        }));

        const updatedFormData = {
          ...formData,
          line_items: lineItemsForCreation
        };

        const yearNum = invoiceYear ? parseInt(invoiceYear, 10) : undefined;
        const seqNum = invoiceSeqNumber ? parseInt(invoiceSeqNumber, 10) : undefined;
        const newInvoice = await InvoiceService.createInvoice(updatedFormData, yearNum, seqNum);
        console.log('Created invoice:', newInvoice);
        isDirty.current = false;
        toast({
          title: "Invoice created",
          description: `Invoice ${newInvoice.invoice_number} has been created successfully.`,
        });
        navigate('/invoices');
      } else if (id) {
        // Build custom invoice number if year/seq provided
        const yearNum = invoiceYear ? parseInt(invoiceYear, 10) : undefined;
        const seqNum = invoiceSeqNumber ? parseInt(invoiceSeqNumber, 10) : undefined;
        let customInvoiceNumber: string | undefined;
        if (yearNum && seqNum) {
          customInvoiceNumber = `INV-${yearNum}-${String(seqNum).padStart(3, '0')}`;
        }

        const invoiceUpdateData: any = {
          client_id: formData.client_id,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          currency: formData.currency,
          payment_terms: formData.payment_terms,
          notes: formData.notes,
          internal_notes: formData.internal_notes,
          ...(customInvoiceNumber ? { invoice_number: customInvoiceNumber } : {})
        };

        await InvoiceService.updateInvoice(id, invoiceUpdateData);
        
        // Update the sequence table if custom number was set
        if (yearNum && seqNum) {
          await InvoiceService.updateInvoiceSequence(yearNum, seqNum);
        }
        
        const existingLineItems = await InvoiceService.getLineItems(id);
        const existingIds = existingLineItems.map(item => item.id);
        
        for (const existingItem of existingLineItems) {
          const stillExists = lineItems.find(item => item.id === existingItem.id);
          if (!stillExists) {
            await InvoiceService.deleteLineItem(existingItem.id);
          }
        }
        
        for (const item of lineItems) {
          if (item.id.startsWith('temp-')) {
            await InvoiceService.addLineItems(id, [{
              item_description: item.item_description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              vat_rate: item.vat_rate,
              discount_rate: item.discount_rate
            }]);
          } else if (existingIds.includes(item.id)) {
            await InvoiceService.updateLineItem(item.id, {
              item_description: item.item_description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              vat_rate: item.vat_rate,
              discount_rate: item.discount_rate
            });
          }
        }

        isDirty.current = false;
        toast({
          title: "Invoice updated",
          description: "Invoice has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: `Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentStatusChange = (status: string) => {
    if (invoice && status === 'paid') {
      setInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('Generating PDF with currency:', formData.currency);
      console.log('Template settings currency:', templateSettings.currency);
      
      const pdfInvoice = invoice ? {
        ...invoice,
        invoice_number: invoiceYear && invoiceSeqNumber
          ? `INV-${invoiceYear}-${invoiceSeqNumber.padStart(3, '0')}`
          : invoice.invoice_number
      } : {
        invoice_number: invoiceYear && invoiceSeqNumber
          ? `INV-${invoiceYear}-${invoiceSeqNumber.padStart(3, '0')}`
          : `INV-${new Date().getFullYear()}-###`,
        issue_date: formData.issue_date || new Date().toISOString(),
        due_date: formData.due_date || new Date(Date.now() + 4*24*60*60*1000).toISOString(),
        status: 'draft'
      } as any;
      
      await generateInvoicePDF({
        invoice: pdfInvoice,
        lineItems,
        client: billToClient,
        templateSettings: {
          ...templateSettings,
          currency: formData.currency // Ensure the current form currency is used
        },
        formData
      });
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);
  const billToClient = selectedClient ? { ...selectedClient, ...billToOverride } : undefined;
  const { netAmount, vatAmount, totalAmount } = calculateTotals();

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={user?.role || "user"}>
            <div className="container mx-auto py-8">
              <div className="text-center">Loading...</div>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" onClick={async () => {
                if (!isNewInvoice && id && isDirty.current) {
                  await handleSave();
                }
                navigate('/invoices');
              }}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Invoices
              </Button>
              <h1 className="text-2xl font-bold">
                {isNewInvoice ? 'Create New Invoice' : `Edit Invoice ${invoice?.invoice_number}`}
              </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="edit">Edit Invoice</TabsTrigger>
                <TabsTrigger value="template">Template Settings</TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Invoice Year & Number */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="invoice_year">Invoice Year</Label>
                            <Input
                              id="invoice_year"
                              type="number"
                              value={invoiceYear}
                              onChange={(e) => setInvoiceYear(e.target.value)}
                              placeholder={new Date().getFullYear().toString()}
                            />
                          </div>
                          <div>
                            <Label htmlFor="invoice_seq">Invoice Number</Label>
                            <Input
                              id="invoice_seq"
                              type="number"
                              value={invoiceSeqNumber}
                              onChange={(e) => setInvoiceSeqNumber(e.target.value)}
                              placeholder="Auto"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {invoiceYear && invoiceSeqNumber
                                ? `INV-${invoiceYear}-${invoiceSeqNumber.padStart(3, '0')}`
                                : 'Leave empty for auto-increment'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="client">Client *</Label>
                            <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={clientPopoverOpen} className="w-full justify-between font-normal">
                                  {formData.client_id
                                    ? (() => { const c = clients.find(c => c.id === formData.client_id); return c ? `${c.name} - ${c.email}` : "Select a client"; })()
                                    : "Select a client"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search by name or email..." />
                                  <CommandList>
                                    <CommandEmpty>No clients found.</CommandEmpty>
                                    <CommandGroup>
                                      {clients.map((client) => (
                                        <CommandItem
                                          key={client.id}
                                          value={`${client.name} ${client.email}`}
                                          onSelect={() => {
                                            handleFormDataChange('client_id', client.id);
                                            setClientPopoverOpen(false);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", formData.client_id === client.id ? "opacity-100" : "opacity-0")} />
                                          {client.name} - {client.email}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          {formData.client_id && (
                            <div className="md:col-span-2 border rounded-md p-3 space-y-3 bg-muted/30">
                              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bill To (PDF Override)</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Name</Label>
                                  <Input value={billToOverride.name} onChange={(e) => setBillToOverride(prev => ({ ...prev, name: e.target.value }))} />
                                </div>
                                <div>
                                  <Label className="text-xs">Email</Label>
                                  <Input value={billToOverride.email} onChange={(e) => setBillToOverride(prev => ({ ...prev, email: e.target.value }))} />
                                </div>
                                <div>
                                  <Label className="text-xs">Address</Label>
                                  <Input value={billToOverride.address} onChange={(e) => setBillToOverride(prev => ({ ...prev, address: e.target.value }))} />
                                </div>
                                <div>
                                  <Label className="text-xs">City</Label>
                                  <Input value={billToOverride.city} onChange={(e) => setBillToOverride(prev => ({ ...prev, city: e.target.value }))} />
                                </div>
                                <div>
                                  <Label className="text-xs">Zip Code</Label>
                                  <Input value={billToOverride.zip_code} onChange={(e) => setBillToOverride(prev => ({ ...prev, zip_code: e.target.value }))} />
                                </div>
                                <div>
                                  <Label className="text-xs">Country</Label>
                                  <Input value={billToOverride.country} onChange={(e) => setBillToOverride(prev => ({ ...prev, country: e.target.value }))} />
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="currency">Currency</Label>
                            <CurrencySelector
                              value={formData.currency}
                              onValueChange={(value) => {
                                console.log('Currency selector changed to:', value);
                                handleFormDataChange('currency', value);
                              }}
                            />
                          </div>

                          <div>
                            <Label htmlFor="issue_date">Issue Date</Label>
                            <Input
                              type="date"
                              value={formData.issue_date}
                              onChange={(e) => handleFormDataChange('issue_date', e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                              type="date"
                              value={formData.due_date}
                              onChange={(e) => handleFormDataChange('due_date', e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="payment_terms">Payment Terms</Label>
                            <Input
                              value={formData.payment_terms}
                              onChange={(e) => handleFormDataChange('payment_terms', e.target.value)}
                              placeholder="e.g., Net 30"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) => handleFormDataChange('notes', e.target.value)}
                            placeholder="Public notes for the client"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="internal_notes">Internal Notes</Label>
                          <Textarea
                            value={formData.internal_notes}
                            onChange={(e) => handleFormDataChange('internal_notes', e.target.value)}
                            placeholder="Internal notes (not visible to client)"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>

                  </div>

                  {/* Summary */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Net Amount:</span>
                          <span>{formatCurrency(netAmount, formData.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT:</span>
                          <span>{formatCurrency(vatAmount, formData.currency)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-3">
                          <span>Total:</span>
                          <span>{formatCurrency(totalAmount, formData.currency)}</span>
                        </div>
                      </CardContent>
                    </Card>


                    <div className="space-y-3">
                      <Button onClick={handleSave} disabled={saving} className="w-full">
                        <Save size={16} className="mr-2" />
                        {saving ? "Saving..." : "Save Invoice"}
                      </Button>
                      
                      {!isNewInvoice && (
                        <>
                          <Button
                            onClick={() => setSendDialogOpen(true)}
                            variant="outline"
                            className="w-full"
                          >
                            <Mail size={16} className="mr-2" />
                            Send Invoice
                          </Button>
                          
                          <Button
                            onClick={handleDownloadPDF}
                            variant="outline"
                            className="w-full"
                          >
                            <Download size={16} className="mr-2" />
                            Download PDF
                          </Button>
                        </>
                      )}
                    </div>

                    
                  </div>
                </div>

                {/* Line Items - Full Width */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Line Items</CardTitle>
                      <Button onClick={addLineItem} variant="outline" size="sm">
                        <Plus size={16} className="mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px] text-left font-semibold">Description</TableHead>
                          <TableHead className="text-center font-semibold">Qty</TableHead>
                          <TableHead className="text-center font-semibold">Unit</TableHead>
                          <TableHead className="text-right font-semibold">Price</TableHead>
                          <TableHead className="text-center font-semibold">VAT %</TableHead>
                          <TableHead className="text-center font-semibold">Discount %</TableHead>
                          <TableHead className="text-right font-semibold">Total</TableHead>
                          <TableHead className="text-center font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item, index) => (
                          <LineItemRow
                            key={item.id}
                            item={item}
                            index={index}
                            currency={formData.currency}
                            onUpdate={updateLineItem}
                            onRemove={removeLineItem}
                          />
                        ))}
                        {lineItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No items added yet. Click "Add Item" to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="template">
                <InvoiceTemplateSettings
                  onSettingsChange={setTemplateSettings}
                  initialSettings={templateSettings}
                />
              </TabsContent>

              <TabsContent value="preview">
                <div className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleDownloadPDF} variant="outline">
                      <Download size={16} className="mr-2" />
                      Download PDF
                    </Button>
                    <Button onClick={() => setSendPDFDialogOpen(true)}>
                      <Mail size={16} className="mr-2" />
                      Send to Client
                    </Button>
                  </div>
                  <InvoicePreview
                    invoice={invoice ? {
                      ...invoice,
                      invoice_number: invoiceYear && invoiceSeqNumber
                        ? `INV-${invoiceYear}-${invoiceSeqNumber.padStart(3, '0')}`
                        : invoice.invoice_number
                    } : {
                      invoice_number: invoiceYear && invoiceSeqNumber
                        ? `INV-${invoiceYear}-${invoiceSeqNumber.padStart(3, '0')}`
                        : `INV-${new Date().getFullYear()}-###`,
                      issue_date: formData.issue_date || new Date().toISOString(),
                      due_date: formData.due_date || new Date(Date.now() + 4*24*60*60*1000).toISOString(),
                      status: 'draft'
                    } as any}
                    lineItems={lineItems}
                    client={billToClient}
                    templateSettings={{
                      ...templateSettings,
                      currency: formData.currency
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {invoice && selectedClient && (
              <SendInvoiceDialog
                open={sendDialogOpen}
                onOpenChange={setSendDialogOpen}
                invoice={invoice}
              />
            )}

            <SendInvoicePDFDialog
              open={sendPDFDialogOpen}
              onOpenChange={setSendPDFDialogOpen}
              invoice={invoice}
              lineItems={lineItems}
              client={billToClient}
              templateSettings={{ ...templateSettings, currency: formData.currency }}
              formData={formData}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default InvoiceDetail;
