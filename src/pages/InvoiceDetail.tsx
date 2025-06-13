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
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [templateSettings, setTemplateSettings] = useState({});

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
          setFormData({
            client_id: invoiceData.client_id,
            issue_date: invoiceData.issue_date.split('T')[0],
            due_date: invoiceData.due_date.split('T')[0],
            currency: invoiceData.currency,
            payment_terms: invoiceData.payment_terms || 'Net 30',
            notes: invoiceData.notes || '',
            internal_notes: invoiceData.internal_notes || '',
            line_items: []
          });

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
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate line total
    const item = updated[index];
    const subtotal = item.quantity * item.unit_price;
    const withDiscount = subtotal * (1 - item.discount_rate);
    const withVat = withDiscount * (1 + item.vat_rate);
    updated[index].line_total = Math.round(withVat * 100) / 100;
    
    setLineItems(updated);
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
      await generateInvoicePDF({
        invoice,
        lineItems,
        client: selectedClient,
        templateSettings,
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
                            <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
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
                              onValueChange={(value) => setFormData({...formData, currency: value})}
                            />
                          </div>

                          <div>
                            <Label htmlFor="issue_date">Issue Date</Label>
                            <Input
                              type="date"
                              value={formData.issue_date}
                              onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                            />
                          </div>

                          <div>
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                              type="date"
                              value={formData.due_date}
                              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                            />
                          </div>

                          <div>
                            <Label htmlFor="payment_terms">Payment Terms</Label>
                            <Input
                              value={formData.payment_terms}
                              onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                              placeholder="e.g., Net 30"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Public notes for the client"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="internal_notes">Internal Notes</Label>
                          <Textarea
                            value={formData.internal_notes}
                            onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
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
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>VAT %</TableHead>
                              <TableHead>Discount %</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lineItems.map((item, index) => (
                              <LineItemRow
                                key={index}
                                item={item}
                                index={index}
                                currency={formData.currency}
                                onUpdate={updateLineItem}
                                onRemove={removeLineItem}
                              />
                            ))}
                          </TableBody>
                        </Table>

                        {/* Totals */}
                        <div className="mt-6 flex justify-end">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between">
                              <span>Net Amount:</span>
                              <span>{formatCurrency(netAmount, formData.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>VAT Amount:</span>
                              <span>{formatCurrency(vatAmount, formData.currency)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                              <span>Total Amount:</span>
                              <span>{formatCurrency(totalAmount, formData.currency)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                      <Button variant="outline" onClick={() => navigate('/invoices')}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        <Save size={16} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Invoice'}
                      </Button>
                      {!isNewInvoice && invoice && (
                        <>
                          <Button onClick={handleDownloadPDF} variant="outline">
                            <Download size={16} className="mr-2" />
                            Download PDF
                          </Button>
                          <Button onClick={() => setSendDialogOpen(true)}>
                            <Mail size={16} className="mr-2" />
                            Send Invoice
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {!isNewInvoice && invoice && (
                      <PaymentTracker
                        invoiceId={invoice.id}
                        currency={invoice.currency}
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
                <InvoicePreview
                  invoice={invoice}
                  lineItems={lineItems}
                  client={selectedClient}
                  templateSettings={templateSettings}
                />
              </TabsContent>
            </Tabs>

            {/* Send Invoice Dialog */}
            {!isNewInvoice && invoice && (
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
