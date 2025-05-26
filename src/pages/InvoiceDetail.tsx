
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvoiceService } from "@/services/invoiceService";

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

      const updatedFormData = {
        ...formData,
        line_items: lineItems.map(item => ({
          item_description: item.item_description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          discount_rate: item.discount_rate
        }))
      };

      if (isNewInvoice) {
        await InvoiceService.createInvoice(updatedFormData);
        toast({
          title: "Invoice created",
          description: "Invoice has been created successfully.",
        });
        navigate('/invoices');
      } else if (id) {
        await InvoiceService.updateInvoice(id, updatedFormData);
        
        // Update line items
        await Promise.all(lineItems.map(async (item) => {
          if (item.id.startsWith('temp-')) {
            // Create new line item
            await InvoiceService.addLineItems(id, [{
              item_description: item.item_description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              vat_rate: item.vat_rate,
              discount_rate: item.discount_rate
            }]);
          } else {
            // Update existing line item
            await InvoiceService.updateLineItem(item.id, item);
          }
        }));

        toast({
          title: "Invoice updated",
          description: "Invoice has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: "Failed to save invoice.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

            <div className="space-y-6">
              {/* Invoice Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client">Client</Label>
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
                      <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.item_description}
                              onChange={(e) => updateLineItem(index, 'item_description', e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.001"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={(item.vat_rate * 100).toFixed(2)}
                              onChange={(e) => updateLineItem(index, 'vat_rate', (parseFloat(e.target.value) || 0) / 100)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={(item.discount_rate * 100).toFixed(2)}
                              onChange={(e) => updateLineItem(index, 'discount_rate', (parseFloat(e.target.value) || 0) / 100)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">€{item.line_total.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="mt-6 flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Net Amount:</span>
                        <span>€{netAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT Amount:</span>
                        <span>€{vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total Amount:</span>
                        <span>€{totalAmount.toFixed(2)}</span>
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
              </div>
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default InvoiceDetail;
