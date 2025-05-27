import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Save, Eye, Download, ArrowLeft, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { generateProposalPDF, previewProposalPDF, loadInventoryItems, formatInventoryItemForProposal, PROPOSAL_STATUSES } from "@/utils/proposalUtils";
import InventoryAutocomplete from "@/components/inventory/InventoryAutocomplete";

interface ProposalLineItem {
  id: string;
  proposal_id: string;
  item_id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  unit?: string;
  created_at: string;
}

interface ProposalData {
  id: string;
  number: string;
  customer: string;
  subject: string;
  reference: string;
  amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  currency: string;
  vatEnabled: boolean;
  vatRate: number;
  
  // Date and time fields
  proposalDate: string;
  proposalTime: string;
  
  // Customer details
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  customerCountry: string;
  customerRef: string;
  
  // Company/Contact details
  yourContact: string;
  internalContact: string;
  
  // Proposal content
  proposalTitle: string;
  proposalDescription: string;
  content: string;
  
  // Terms and delivery
  deliveryTerms: string;
  paymentTerms: string;
  termsAndConditions: string;
  
  // Payment data
  accountNumber: string;
  accountName: string;
  paymentMethod: string;
  
  // Footer and company info
  footerContent: string;
  logo?: string;
  logoSize?: number;
  signatureUrl?: string;
  
  // Line items
  lineItems: ProposalLineItem[];
  
  // Calculated totals
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isNewProposal = id === "new" || !id;

  const [proposalData, setProposalData] = useState<ProposalData>({
    id: isNewProposal ? uuidv4() : id || "",
    number: "",
    customer: "",
    subject: "",
    reference: "",
    amount: "0.00",
    status: "Draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: "EUR",
    vatEnabled: true,
    vatRate: 19,
    
    // Date and time fields with current date/time as default
    proposalDate: new Date().toISOString().split('T')[0],
    proposalTime: new Date().toTimeString().slice(0, 5),
    
    // Customer details
    customerName: "",
    customerAddress: "",
    customerEmail: "",
    customerCountry: "",
    customerRef: "",
    
    // Company/Contact details
    yourContact: "Thomas Klein",
    internalContact: "Thomas Klein",
    
    // Proposal content
    proposalTitle: "",
    proposalDescription: "",
    content: "",
    
    // Terms and delivery
    deliveryTerms: "7 days after receipt of invoice",
    paymentTerms: "By placing your order you agree to pay for the services included in this offer within 7 days of receipt of the invoice.",
    termsAndConditions: "",
    
    // Payment data
    accountNumber: "",
    accountName: "",
    paymentMethod: "CREDIT CARD",
    
    // Footer and company info
    footerContent: "",
    logoSize: 33,
    
    // Line items
    lineItems: [],
    
    // Calculated totals
    netAmount: 0,
    vatAmount: 0,
    totalAmount: 0
  });

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProposal();
    loadInventory();
  }, [id]);

  const loadInventory = () => {
    const items = loadInventoryItems();
    setInventoryItems(items);
  };

  const loadProposal = () => {
    try {
      if (isNewProposal) {
        // Generate a new proposal number
        const savedProposals = localStorage.getItem("proposals");
        const proposals = savedProposals ? JSON.parse(savedProposals) : [];
        const nextNumber = `AN-${(9984 + proposals.length + 1).toString()}`;
        
        setProposalData(prev => ({
          ...prev,
          number: nextNumber,
          reference: `REF-${new Date().getFullYear()}-${(proposals.length + 1).toString().padStart(3, '0')}`
        }));
      } else {
        const savedProposals = localStorage.getItem("proposals");
        if (savedProposals) {
          const proposals = JSON.parse(savedProposals);
          const proposal = proposals.find((p: any) => p.id === id);
          
          if (proposal) {
            // Load detailed proposal data
            const savedDetailedProposals = localStorage.getItem("detailedProposals");
            let detailedProposal = null;
            
            if (savedDetailedProposals) {
              const detailedProposals = JSON.parse(savedDetailedProposals);
              detailedProposal = detailedProposals.find((p: any) => p.id === id);
            }
            
            // Merge basic and detailed data
            const mergedData = {
              ...proposalData,
              ...proposal,
              ...detailedProposal,
              lineItems: detailedProposal?.lineItems || [],
              netAmount: detailedProposal?.netAmount || parseFloat(proposal.amount) || 0,
              vatAmount: detailedProposal?.vatAmount || 0,
              totalAmount: detailedProposal?.totalAmount || parseFloat(proposal.amount) || 0
            };
            
            setProposalData(mergedData);
          }
        }
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
      toast({
        title: "Error",
        description: "Failed to load proposal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (lineItems: ProposalLineItem[], vatEnabled: boolean, vatRate: number) => {
    const netAmount = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const vatAmount = vatEnabled ? (netAmount * vatRate / 100) : 0;
    const totalAmount = netAmount + vatAmount;
    
    return { netAmount, vatAmount, totalAmount };
  };

  const handleLineItemChange = (index: number, field: keyof ProposalLineItem, value: any) => {
    const updatedLineItems = [...proposalData.lineItems];
    updatedLineItems[index] = { ...updatedLineItems[index], [field]: value };
    
    // Recalculate line item total if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedLineItems[index];
      item.total_price = item.quantity * item.unit_price;
    }
    
    // Recalculate totals
    const { netAmount, vatAmount, totalAmount } = calculateTotals(updatedLineItems, proposalData.vatEnabled, proposalData.vatRate);
    
    setProposalData(prev => ({
      ...prev,
      lineItems: updatedLineItems,
      netAmount,
      vatAmount,
      totalAmount,
      amount: totalAmount.toFixed(2)
    }));
  };

  const handleInventoryItemSelect = (index: number, inventoryItem: any) => {
    const updatedLineItems = [...proposalData.lineItems];
    const parsePrice = (priceStr: string) => {
      if (!priceStr) return 0;
      const numStr = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
      return parseFloat(numStr) || 0;
    };

    updatedLineItems[index] = {
      ...updatedLineItems[index],
      item_id: inventoryItem.id,
      name: inventoryItem.name,
      description: inventoryItem.description || '',
      unit_price: parsePrice(inventoryItem.price),
      total_price: updatedLineItems[index].quantity * parsePrice(inventoryItem.price),
      category: inventoryItem.category,
      unit: inventoryItem.unit
    };

    const { netAmount, vatAmount, totalAmount } = calculateTotals(updatedLineItems, proposalData.vatEnabled, proposalData.vatRate);
    
    setProposalData(prev => ({
      ...prev,
      lineItems: updatedLineItems,
      netAmount,
      vatAmount,
      totalAmount,
      amount: totalAmount.toFixed(2)
    }));
  };

  const handleAddLineItem = () => {
    const newItem: ProposalLineItem = {
      id: uuidv4(),
      proposal_id: proposalData.id,
      name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      unit: "unit",
      created_at: new Date().toISOString()
    };
    
    setProposalData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    const updatedLineItems = proposalData.lineItems.filter((_, i) => i !== index);
    const { netAmount, vatAmount, totalAmount } = calculateTotals(updatedLineItems, proposalData.vatEnabled, proposalData.vatRate);
    
    setProposalData(prev => ({
      ...prev,
      lineItems: updatedLineItems,
      netAmount,
      vatAmount,
      totalAmount,
      amount: totalAmount.toFixed(2)
    }));
  };

  const handleAddFromInventory = (inventoryItem: any) => {
    const formattedItem = formatInventoryItemForProposal(inventoryItem, 1);
    formattedItem.proposal_id = proposalData.id;
    
    const updatedLineItems = [...proposalData.lineItems, formattedItem];
    const { netAmount, vatAmount, totalAmount } = calculateTotals(updatedLineItems, proposalData.vatEnabled, proposalData.vatRate);
    
    setProposalData(prev => ({
      ...prev,
      lineItems: updatedLineItems,
      netAmount,
      vatAmount,
      totalAmount,
      amount: totalAmount.toFixed(2)
    }));
    
    toast({
      title: "Item added",
      description: `${inventoryItem.name} has been added to the proposal.`,
    });
  };

  const handleVatToggle = (enabled: boolean) => {
    const { netAmount, vatAmount, totalAmount } = calculateTotals(proposalData.lineItems, enabled, proposalData.vatRate);
    
    setProposalData(prev => ({
      ...prev,
      vatEnabled: enabled,
      vatAmount,
      totalAmount,
      amount: totalAmount.toFixed(2)
    }));
  };

  const handleVatRateChange = (rate: number) => {
    const { netAmount, vatAmount, totalAmount } = calculateTotals(proposalData.lineItems, proposalData.vatEnabled, rate);
    
    setProposalData(prev => ({
      ...prev,
      vatRate: rate,
      vatAmount,
      totalAmount,
      amount: totalAmount.toFixed(2)
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setProposalData(prev => ({
          ...prev,
          logo: logoUrl
        }));
        toast({
          title: "Logo uploaded",
          description: "Company logo has been uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSizeChange = (size: number) => {
    setProposalData(prev => ({
      ...prev,
      logoSize: size
    }));
  };

  const saveProposal = async () => {
    setSaving(true);
    try {
      // Save to basic proposals list
      const savedProposals = localStorage.getItem("proposals");
      const proposals = savedProposals ? JSON.parse(savedProposals) : [];
      
      const basicProposalData = {
        id: proposalData.id,
        number: proposalData.number,
        customer: proposalData.customerName || proposalData.customer,
        subject: proposalData.subject,
        reference: proposalData.reference,
        amount: proposalData.amount,
        status: proposalData.status,
        created_at: proposalData.created_at,
        updated_at: new Date().toISOString(),
        currency: proposalData.currency,
        vatEnabled: proposalData.vatEnabled
      };
      
      const existingIndex = proposals.findIndex((p: any) => p.id === proposalData.id);
      if (existingIndex >= 0) {
        proposals[existingIndex] = basicProposalData;
      } else {
        proposals.push(basicProposalData);
      }
      
      localStorage.setItem("proposals", JSON.stringify(proposals));
      
      // Save detailed proposal data
      const savedDetailedProposals = localStorage.getItem("detailedProposals");
      const detailedProposals = savedDetailedProposals ? JSON.parse(savedDetailedProposals) : [];
      
      const detailedExistingIndex = detailedProposals.findIndex((p: any) => p.id === proposalData.id);
      const updatedProposalData = {
        ...proposalData,
        updated_at: new Date().toISOString()
      };
      
      if (detailedExistingIndex >= 0) {
        detailedProposals[detailedExistingIndex] = updatedProposalData;
      } else {
        detailedProposals.push(updatedProposalData);
      }
      
      localStorage.setItem("detailedProposals", JSON.stringify(detailedProposals));
      
      toast({
        title: "Proposal saved",
        description: "Proposal has been saved successfully.",
      });
      
      if (isNewProposal) {
        navigate(`/proposals/${proposalData.id}`);
      }
    } catch (error) {
      console.error("Error saving proposal:", error);
      toast({
        title: "Error",
        description: "Failed to save proposal.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    // Ensure data is saved before preview
    await saveProposal();
    
    // Prepare proposal data for PDF generation with all editable fields
    const pdfProposalData = {
      ...proposalData,
      // Ensure customer data is properly mapped
      customer: proposalData.customerName || proposalData.customer,
      // Map internal contact properly
      yourContact: proposalData.internalContact || proposalData.yourContact,
      // Ensure line items include descriptions
      lineItems: proposalData.lineItems.map(item => ({
        ...item,
        // Ensure description is included
        additionalInfo: item.description
      }))
    };
    
    console.log('Preview data being sent:', pdfProposalData);
    
    const success = await previewProposalPDF(pdfProposalData, 'en');
    if (!success) {
      toast({
        title: "Preview failed",
        description: "Failed to generate proposal preview.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    // Ensure data is saved before download
    await saveProposal();
    
    // Prepare proposal data for PDF generation with all editable fields
    const pdfProposalData = {
      ...proposalData,
      // Ensure customer data is properly mapped
      customer: proposalData.customerName || proposalData.customer,
      // Map internal contact properly
      yourContact: proposalData.internalContact || proposalData.yourContact,
      // Ensure line items include descriptions
      lineItems: proposalData.lineItems.map(item => ({
        ...item,
        // Ensure description is included
        additionalInfo: item.description
      }))
    };
    
    console.log('Download data being sent:', pdfProposalData);
    
    const success = await generateProposalPDF(pdfProposalData, 'en', `proposal-${proposalData.number}.pdf`);
    if (success) {
      toast({
        title: "Proposal downloaded",
        description: `Proposal ${proposalData.number} has been downloaded as PDF.`,
      });
    } else {
      toast({
        title: "Download failed",
        description: "Failed to download proposal as PDF.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={user?.role || "user"}>
            <div className="container mx-auto py-8">
              <div className="text-center">Loading proposal...</div>
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
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/proposals")}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Proposals
                </Button>
                <h1 className="text-2xl font-bold">
                  {isNewProposal ? "Create New Proposal" : `Edit Proposal ${proposalData.number}`}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePreview} variant="outline">
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download size={16} className="mr-2" />
                  Download PDF
                </Button>
                <Button onClick={saveProposal} disabled={saving}>
                  <Save size={16} className="mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="number">Proposal Number</Label>
                      <Input
                        id="number"
                        value={proposalData.number}
                        onChange={(e) => setProposalData(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference">Reference</Label>
                      <Input
                        id="reference"
                        value={proposalData.reference}
                        onChange={(e) => setProposalData(prev => ({ ...prev, reference: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={proposalData.subject}
                      onChange={(e) => setProposalData(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={proposalData.status} 
                        onValueChange={(value) => setProposalData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPOSAL_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={proposalData.currency} 
                        onValueChange={(value) => setProposalData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Date and Time Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="proposalDate" className="flex items-center gap-2">
                        <Calendar size={16} />
                        Proposal Date
                      </Label>
                      <Input
                        id="proposalDate"
                        type="date"
                        value={proposalData.proposalDate}
                        onChange={(e) => setProposalData(prev => ({ ...prev, proposalDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="proposalTime" className="flex items-center gap-2">
                        <Clock size={16} />
                        Proposal Time
                      </Label>
                      <Input
                        id="proposalTime"
                        type="time"
                        value={proposalData.proposalTime}
                        onChange={(e) => setProposalData(prev => ({ ...prev, proposalTime: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Logo Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Logo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="logoUpload">Upload Company Logo</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  {proposalData.logo && (
                    <div className="space-y-4">
                      <div>
                        <Label>Logo Preview</Label>
                        <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                          <img
                            src={proposalData.logo}
                            alt="Company Logo"
                            style={{ maxWidth: `${proposalData.logoSize || 33}%`, maxHeight: '80px' }}
                            className="object-contain"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="logoSize">Logo Size: {proposalData.logoSize || 33}%</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogoSizeChange(Math.max(10, (proposalData.logoSize || 33) - 5))}
                          >
                            -
                          </Button>
                          <span className="min-w-[60px] text-center">{proposalData.logoSize || 33}%</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogoSizeChange(Math.min(100, (proposalData.logoSize || 33) + 5))}
                          >
                            +
                          </Button>
                        </div>
                        <Input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={proposalData.logoSize || 33}
                          onChange={(e) => handleLogoSizeChange(parseInt(e.target.value))}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={proposalData.customerName}
                      onChange={(e) => setProposalData(prev => ({ ...prev, customerName: e.target.value, customer: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customerAddress">Customer Address</Label>
                    <Textarea
                      id="customerAddress"
                      value={proposalData.customerAddress}
                      onChange={(e) => setProposalData(prev => ({ ...prev, customerAddress: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerEmail">Customer Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={proposalData.customerEmail}
                        onChange={(e) => setProposalData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerCountry">Country</Label>
                      <Input
                        id="customerCountry"
                        value={proposalData.customerCountry}
                        onChange={(e) => setProposalData(prev => ({ ...prev, customerCountry: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerRef">Customer Reference</Label>
                      <Input
                        id="customerRef"
                        value={proposalData.customerRef}
                        onChange={(e) => setProposalData(prev => ({ ...prev, customerRef: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="internalContact">Internal Contact Person</Label>
                      <Input
                        id="internalContact"
                        value={proposalData.internalContact}
                        onChange={(e) => setProposalData(prev => ({ ...prev, internalContact: e.target.value, yourContact: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proposal Content */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Proposal Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="proposalTitle">Proposal Title</Label>
                    <Input
                      id="proposalTitle"
                      value={proposalData.proposalTitle}
                      onChange={(e) => setProposalData(prev => ({ ...prev, proposalTitle: e.target.value }))}
                      placeholder="e.g., Protect your online REPUTATION!"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="proposalDescription">Proposal Description</Label>
                    <Textarea
                      id="proposalDescription"
                      value={proposalData.proposalDescription}
                      onChange={(e) => setProposalData(prev => ({ ...prev, proposalDescription: e.target.value }))}
                      rows={3}
                      placeholder="Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Additional Content</Label>
                    <Textarea
                      id="content"
                      value={proposalData.content}
                      onChange={(e) => setProposalData(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Products/Services
                    <Button onClick={handleAddLineItem} size="sm">
                      <PlusCircle size={16} className="mr-2" />
                      Add Line Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proposalData.lineItems.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product/Service Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposalData.lineItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <InventoryAutocomplete
                                value={item.name}
                                onChange={(value) => handleLineItemChange(index, 'name', value)}
                                onSelect={(inventoryItem) => handleInventoryItemSelect(index, inventoryItem)}
                                inventoryItems={inventoryItems}
                                placeholder="Type to search products..."
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={item.description}
                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                placeholder="Detailed description of the product/service"
                                rows={2}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell>
                              {proposalData.currency === 'USD' ? '$' : proposalData.currency === 'GBP' ? '£' : '€'}
                              {item.total_price.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLineItem(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* VAT and Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>VAT & Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="vatEnabled"
                      checked={proposalData.vatEnabled}
                      onCheckedChange={handleVatToggle}
                    />
                    <Label htmlFor="vatEnabled">VAT Enabled</Label>
                  </div>
                  
                  {proposalData.vatEnabled && (
                    <div>
                      <Label htmlFor="vatRate">VAT Rate (%)</Label>
                      <Input
                        id="vatRate"
                        type="number"
                        value={proposalData.vatRate}
                        onChange={(e) => handleVatRateChange(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Net Amount:</span>
                      <span>{proposalData.currency === 'USD' ? '$' : proposalData.currency === 'GBP' ? '£' : '€'}{proposalData.netAmount.toFixed(2)}</span>
                    </div>
                    {proposalData.vatEnabled && (
                      <div className="flex justify-between">
                        <span>VAT ({proposalData.vatRate}%):</span>
                        <span>{proposalData.currency === 'USD' ? '$' : proposalData.currency === 'GBP' ? '£' : '€'}{proposalData.vatAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Amount:</span>
                      <span>{proposalData.currency === 'USD' ? '$' : proposalData.currency === 'GBP' ? '£' : '€'}{proposalData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deliveryTerms">Delivery Terms</Label>
                    <Input
                      id="deliveryTerms"
                      value={proposalData.deliveryTerms}
                      onChange={(e) => setProposalData(prev => ({ ...prev, deliveryTerms: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Textarea
                      id="paymentTerms"
                      value={proposalData.paymentTerms}
                      onChange={(e) => setProposalData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="termsAndConditions">Additional Terms</Label>
                    <Textarea
                      id="termsAndConditions"
                      value={proposalData.termsAndConditions}
                      onChange={(e) => setProposalData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="footerContent">Footer Content</Label>
                    <Textarea
                      id="footerContent"
                      value={proposalData.footerContent}
                      onChange={(e) => setProposalData(prev => ({ ...prev, footerContent: e.target.value }))}
                      rows={3}
                      placeholder="Additional footer information"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Data */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Payment Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={proposalData.accountNumber}
                        onChange={(e) => setProposalData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="9670238783"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        value={proposalData.accountName}
                        onChange={(e) => setProposalData(prev => ({ ...prev, accountName: e.target.value }))}
                        placeholder="COMPANY NAME"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select 
                        value={proposalData.paymentMethod} 
                        onValueChange={(value) => setProposalData(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT CARD">CREDIT CARD</SelectItem>
                          <SelectItem value="BANK TRANSFER">BANK TRANSFER</SelectItem>
                          <SelectItem value="PAYPAL">PAYPAL</SelectItem>
                          <SelectItem value="CASH">CASH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default ProposalDetail;
