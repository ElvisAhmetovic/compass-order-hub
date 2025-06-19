
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, ArrowLeft, Mail, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvoiceService } from "@/services/invoiceService";
import CurrencySelector from "@/components/invoices/CurrencySelector";
import { formatCurrency } from "@/utils/currencyUtils";
import LineItemRow from "@/components/invoices/LineItemRow";
import SendInvoiceDialog from "@/components/invoices/SendInvoiceDialog";
import PaymentTracker from "@/components/invoices/PaymentTracker";
import InvoiceTemplateSettings from "@/components/invoices/InvoiceTemplateSettings";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isNewInvoice = id === 'new';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [templateSettings, setTemplateSettings] = useState({
    currency: 'EUR', // Default currency
    vatEnabled: true,
    vatRate: 0.19,
    language: 'en',
    selectedPaymentAccount: 'belgium',
    companyInfo: {
      name: "Company Name",
      registrationNumber: "123456789",
      vatId: "VAT123456789",
      street: "Street Address",
      postal: "12345",
      city: "City",
      email: "info@company.com"
    }
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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load clients
      const clientsData = await InvoiceService.getClients();
      setClients(clientsData);

      if (!isNewInvoice && id) {
        // Load existing invoice
        const invoiceData = await InvoiceService.getInvoice(id);
        if (invoiceData) {
          setInvoice(invoiceData);
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

          // Load line items
          const lineItemsData = await InvoiceService.getLineItems(id);
          setLineItems(lineItemsData);
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
    }
  };

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
      vat_rate: 0.19,
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
      
      // Update the specific field
      currentItem[field] = value;
      console.log('Updated field', field, 'to:', value);
      
      // Recalculate line total
      const subtotal = currentItem.quantity * currentItem.unit_price;
      const withDiscount = subtotal * (1 - currentItem.discount_rate);
      const withVat = withDiscount * (1 + currentItem.vat_rate);
      currentItem.line_total = Math.round(withVat * 100) / 100;
      
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

        const newInvoice = await InvoiceService.createInvoice(updatedFormData);
        console.log('Created invoice:', newInvoice);
        toast({
          title: "Invoice created",
          description: `Invoice ${newInvoice.invoice_number} has been created successfully.`,
        });
        navigate('/invoices');
      } else if (id) {
        const invoiceUpdateData = {
          client_id: formData.client_id,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          currency: formData.currency,
          payment_terms: formData.payment_terms,
          notes: formData.notes,
          internal_notes: formData.internal_notes
        };

        await InvoiceService.updateInvoice(id, invoiceUpdateData);
        
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
      
      await generateInvoicePDF({
        invoice,
        lineItems,
        client: selectedClient,
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
              <Button variant="ghost" onClick={() => navigate('/invoices')}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="client">Client *</Label>
                            <Select value={formData.client_id} onValueChange={(value) => handleFormDataChange('client_id', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name} - {client.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
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

                    {/* Line Items */}
                    <Card>
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
                        <div className="overflow-x-auto">
                          <div className="min-w-[1000px]">
                            <Table>
                              <TableHeader>
                                <TableRow className="h-16">
                                  <TableHead className="w-1/2 min-w-[350px] text-left font-semibold">Description</TableHead>
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
                          </div>
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

                    {!isNewInvoice && id && (
                      <PaymentTracker
                        invoiceId={id}
                        currency={formData.currency}
                        amount={totalAmount}
                        onPaymentStatusChange={handlePaymentStatusChange}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="template">
                <InvoiceTemplateSettings
                  onSettingsChange={setTemplateSettings}
                  initialSettings={templateSettings}
                />
              </TabsContent>

              <TabsContent value="preview">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={handleDownloadPDF} variant="outline">
                      <Download size={16} className="mr-2" />
                      Download PDF
                    </Button>
                  </div>
                  <InvoicePreview
                    invoice={invoice}
                    lineItems={lineItems}
                    client={selectedClient}
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
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default InvoiceDetail;
