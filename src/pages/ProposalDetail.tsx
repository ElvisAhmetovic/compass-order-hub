import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, Download, Printer, Eye, Plus, Trash2 } from "lucide-react";
import { Proposal } from "@/types";
import { v4 as uuidv4 } from "uuid";

const proposalSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  subject: z.string().min(1, "Subject is required"),
  number: z.string().min(1, "Proposal number is required"),
  reference: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  content: z.string().min(1, "Content is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("EUR"),
  deliveryTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  internalContact: z.string().default("Thomas Klein"),
  vatRule: z.string().default("umsatzsteuerpflichtig"),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  vat: number;
  discount: number;
  amount: number;
}

const ProposalDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1.0,
      unit: "pcs",
      price: 0.0,
      vat: 19,
      discount: 0,
      amount: 0.0
    }
  ]);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      customer: "",
      subject: "Proposal No. 9984",
      number: "AN-9984",
      reference: "",
      date: new Date().toISOString().split('T')[0],
      address: "123 Sample Street\nLLC & City",
      country: "Deutschland",
      content: "Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.",
      amount: "0.00",
      currency: "EUR",
      deliveryTerms: "",
      paymentTerms: "",
      internalContact: "Thomas Klein",
      vatRule: "umsatzsteuerpflichtig",
    },
  });

  // Load existing proposal if editing
  useEffect(() => {
    if (id && id !== "new") {
      const savedProposals = localStorage.getItem("proposals");
      if (savedProposals) {
        const proposals: Proposal[] = JSON.parse(savedProposals);
        const existingProposal = proposals.find(p => p.id === id);
        if (existingProposal) {
          form.reset({
            customer: existingProposal.customer,
            subject: existingProposal.subject || "Proposal",
            number: existingProposal.number,
            reference: existingProposal.reference,
            date: new Date().toISOString().split('T')[0],
            address: "123 Sample Street\nLLC & City",
            country: "Deutschland",
            content: "Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.",
            amount: existingProposal.amount,
            currency: "EUR",
            deliveryTerms: "",
            paymentTerms: "",
            internalContact: "Thomas Klein",
            vatRule: "umsatzsteuerpflichtig",
          });
        }
      }
    }
  }, [id, form]);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1.0,
      unit: "pcs",
      price: 0.0,
      vat: 19,
      discount: 0,
      amount: 0.0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate amount when quantity, price, or discount changes
        if (field === 'quantity' || field === 'price' || field === 'discount') {
          const baseAmount = updatedItem.quantity * updatedItem.price;
          const discountAmount = baseAmount * (updatedItem.discount / 100);
          updatedItem.amount = baseAmount - discountAmount;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const saveProposal = (data: ProposalFormValues, status: string = "Draft") => {
    const savedProposals = localStorage.getItem("proposals");
    const proposals: Proposal[] = savedProposals ? JSON.parse(savedProposals) : [];
    
    const proposalData: Proposal = {
      id: id === "new" ? uuidv4() : id!,
      reference: data.reference || `REF-${new Date().getFullYear()}-${String(proposals.length + 1).padStart(3, '0')}`,
      number: data.number,
      customer: data.customer,
      subject: data.subject,
      amount: totalAmount.toFixed(2),
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (id === "new") {
      proposals.push(proposalData);
    } else {
      const index = proposals.findIndex(p => p.id === id);
      if (index >= 0) {
        proposals[index] = { ...proposals[index], ...proposalData };
      } else {
        proposals.push(proposalData);
      }
    }

    localStorage.setItem("proposals", JSON.stringify(proposals));
    return proposalData;
  };

  const downloadProposal = () => {
    const proposalData = {
      ...form.getValues(),
      lineItems,
      totalAmount: lineItems.reduce((sum, item) => sum + item.amount, 0)
    };
    
    // Create a simple PDF-like content
    const content = `
PROPOSAL ${proposalData.number}
Customer: ${proposalData.customer}
Subject: ${proposalData.subject}
Date: ${proposalData.date}

Address:
${proposalData.address}
${proposalData.country}

Content:
${proposalData.content}

Line Items:
${lineItems.map(item => 
  `${item.description} - Qty: ${item.quantity} - Price: €${item.price} - Amount: €${item.amount.toFixed(2)}`
).join('\n')}

Total Amount: €${proposalData.totalAmount.toFixed(2)}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal_${proposalData.number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your proposal has been downloaded.",
    });
  };

  const printProposal = () => {
    window.print();
    toast({
      title: "Print dialog opened",
      description: "Your proposal is ready to print.",
    });
  };

  const previewProposal = () => {
    toast({
      title: "Preview mode",
      description: "Showing proposal preview (feature coming soon).",
    });
  };

  const saveAsDraft = () => {
    const data = form.getValues();
    saveProposal(data, "Draft");
    toast({
      title: "Proposal saved",
      description: "Your proposal has been saved as a draft.",
    });
  };

  const sendProposal = () => {
    const data = form.getValues();
    if (!data.customer || !data.subject) {
      toast({
        title: "Missing information",
        description: "Please fill in customer and subject fields.",
        variant: "destructive",
      });
      return;
    }
    
    saveProposal(data, "Sent");
    toast({
      title: "Proposal sent",
      description: "Your proposal has been sent to the customer.",
    });
  };

  const onSubmit = (data: ProposalFormValues) => {
    setIsSubmitting(true);
    
    try {
      saveProposal(data, "Draft");
      toast({
        title: "Proposal saved",
        description: "Your proposal has been saved successfully.",
      });
      navigate("/proposals");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save proposal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = lineItems.reduce((sum, item) => sum + (item.amount * item.vat / 100), 0);
  const netAmount = totalAmount - vatAmount;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/proposals")}>
                  <ArrowLeft size={16} />
                </Button>
                <h1 className="text-2xl font-bold">{id === "new" ? "Create proposal" : "Edit proposal"}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previewProposal}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={saveAsDraft}>
                  <Save className="h-4 w-4 mr-1" />
                  Save as draft
                </Button>
                <div className="flex items-center">
                  <Button size="sm" className="bg-blue-600 rounded-r-none" onClick={sendProposal}>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                  <div className="flex border-l border-white/20">
                    <Button variant="outline" size="sm" className="rounded-none border-l-0" onClick={printProposal}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-l-none border-l-0" onClick={downloadProposal}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    {/* Contact and proposal information section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Contact and proposal information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="customer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer</FormLabel>
                                <FormControl>
                                  <Input placeholder="Search / create contact" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea rows={4} {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Proposal no.</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Proposal date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reference / Order No.</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Proposal content section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Proposal Content
                      </h2>
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                rows={6}
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Products section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Products
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Line item or service
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                                Quantity
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                                Price (gross)
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                                VAT
                              </th>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                                Discount
                              </th>
                              <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                                Amount
                              </th>
                              <th className="px-2 py-3 w-[50px]"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {lineItems.map((item, index) => (
                              <tr key={item.id}>
                                <td className="px-2 py-3">
                                  <Input 
                                    placeholder="Search product" 
                                    className="text-sm"
                                    value={item.description}
                                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                  />
                                </td>
                                <td className="px-2 py-3">
                                  <div className="flex items-center">
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      value={item.quantity}
                                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="text-sm" 
                                    />
                                    <span className="ml-1 text-xs">{item.unit}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-3">
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                    className="text-sm text-right" 
                                  />
                                </td>
                                <td className="px-2 py-3">
                                  <Input 
                                    type="text" 
                                    value={`${item.vat}%`}
                                    onChange={(e) => updateLineItem(item.id, 'vat', parseInt(e.target.value) || 19)}
                                    className="text-sm" 
                                  />
                                </td>
                                <td className="px-2 py-3">
                                  <div className="flex items-center">
                                    <Input 
                                      type="number" 
                                      value={item.discount}
                                      onChange={(e) => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                      className="text-sm" 
                                    />
                                    <span className="ml-1 text-xs">%</span>
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-right">
                                  <div className="flex items-center justify-end">
                                    <span className="text-sm font-medium">€{item.amount.toFixed(2)}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-3">
                                  {lineItems.length > 1 && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => removeLineItem(item.id)}
                                      className="h-6 w-6"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <Button variant="outline" type="button" size="sm" className="text-blue-600" onClick={addLineItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add line item
                        </Button>
                      </div>
                    </div>
                    
                    {/* Footer content section */}
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold bg-gray-100 p-2 mb-4 uppercase">
                        Footer content
                      </h2>
                      <Textarea 
                        rows={4}
                        defaultValue="By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided."
                        className="min-h-[80px] w-full"
                      />
                    </div>

                    {/* Options section */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold bg-gray-100 p-2 uppercase">
                          More Options
                        </h2>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          Hide options
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Currency */}
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        {/* Internal contact person */}
                        <FormField
                          control={form.control}
                          name="internalContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Internal contact person</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contact" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Thomas Klein">Thomas Klein</SelectItem>
                                  <SelectItem value="Maria Schmidt">Maria Schmidt</SelectItem>
                                  <SelectItem value="John Doe">John Doe</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        {/* VAT rule */}
                        <FormField
                          control={form.control}
                          name="vatRule"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT rule</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <div className="font-medium text-sm">In Germany</div>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="space-y-2"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="umsatzsteuerpflichtig" id="r1" />
                                      <Label htmlFor="r1" className="text-sm">Umsatzsteuerpflichtige Umsätze</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="steuerfreie" id="r2" />
                                      <Label htmlFor="r2" className="text-sm">Steuerfreie Umsätze §4 UStG</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="reverse-charge" id="r3" />
                                      <Label htmlFor="r3" className="text-sm">Reverse Charge gem. §13b UStG</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Delivery terms */}
                        <FormField
                          control={form.control}
                          name="deliveryTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery terms</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter delivery terms" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Payment terms */}
                        <FormField
                          control={form.control}
                          name="paymentTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment terms</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter payment terms" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Summary section */}
                    <div>
                      <div className="flex justify-end">
                        <div className="w-64">
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-700">Net amount (inc. discount/surcharge)</span>
                            <span className="font-medium">€{netAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-700">VAT 19%</span>
                            <span className="font-medium">€{vatAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-t border-gray-200 mt-1">
                            <span className="font-medium">Total</span>
                            <span className="font-bold">€{totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/proposals")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Proposal"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default ProposalDetail;
