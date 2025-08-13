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
import { PlusCircle, Trash2, Save, Eye, Download, ArrowLeft, Calendar, Clock, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { generateProposalPDF, previewProposalPDF, PROPOSAL_STATUSES, formatInventoryItemForProposal } from "@/utils/proposalUtils";
import InventoryAutocomplete from "@/components/inventory/InventoryAutocomplete";
import TemplateManager from "@/components/proposals/TemplateManager";
import { getDefaultTemplate, createProposalFromTemplate } from "@/utils/templateUtils";
import { useInventory } from "@/hooks/useInventory";
import { SUPPORTED_LANGUAGES } from "@/utils/proposalTranslations";
import { PREDEFINED_PACKAGES, type PredefinedPackage } from "@/data/predefinedPackages";

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
  
  // Payment data - updated fields
  iban: string;
  bic: string;
  blzKonto: string;
  
  // Footer and company info
  footerContent: string;
  logo?: string;
  logoSize?: number;
  signatureUrl?: string;
  includePaymentData: boolean;
  
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
  const { inventoryData, loading: inventoryLoading } = useInventory();
  const isNewProposal = id === "new" || !id;

  // Add language state for PDF output only
  const [pdfLanguage, setPdfLanguage] = useState('en');

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
    
    // Payment data - updated with new fields
    iban: "BE79967023897833",
    bic: "TRWIBEB1XXX",
    blzKonto: "967 KONTO: 967023897833",
    
    // Footer and company info
    footerContent: "",
    logoSize: 33,
    includePaymentData: true,
    
    // Line items
    lineItems: [],
    
    // Calculated totals
    netAmount: 0,
    vatAmount: 0,
    totalAmount: 0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translatePackages, setTranslatePackages] = useState(true);

  useEffect(() => {
    loadProposal();
  }, [id]);

  useEffect(() => {
    if (!isNewProposal) {
      const savedDetailedProposals = localStorage.getItem("detailedProposals");
      if (savedDetailedProposals) {
        const detailedProposals = JSON.parse(savedDetailedProposals);
        const detailedProposal = detailedProposals.find((p: any) => p.id === id);
        if (detailedProposal?.pdfLanguage) {
          setPdfLanguage(detailedProposal.pdfLanguage);
        }
      }
    }
  }, [id, isNewProposal]);

  const loadProposal = () => {
    try {
      if (isNewProposal) {
        // Check for default template first
        const defaultTemplate = getDefaultTemplate();
        
        if (defaultTemplate) {
          // Use default template as starting point
          const templateProposal = createProposalFromTemplate(defaultTemplate, uuidv4());
          setProposalData(templateProposal);
        } else {
          // Generate a new proposal number for blank proposal
          const savedProposals = localStorage.getItem("proposals");
          const proposals = savedProposals ? JSON.parse(savedProposals) : [];
          const nextNumber = `AN-${(9984 + proposals.length + 1).toString()}`;
          
          setProposalData(prev => ({
            ...prev,
            number: nextNumber,
            reference: `REF-${new Date().getFullYear()}-${(proposals.length + 1).toString().padStart(3, '0')}`
          }));
        }
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

  const handleLoadTemplate = (templateData: any) => {
    const newProposalData = createProposalFromTemplate(templateData, proposalData.id);
    setProposalData(newProposalData);
    
    toast({
      title: "Template applied",
      description: "The template has been applied to this proposal.",
    });
  };

  const calculateTotals = (lineItems: ProposalLineItem[], vatEnabled: boolean, vatRate: number) => {
    // Total amount is the gross amount (VAT-inclusive)
    const totalAmount = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    
    if (vatEnabled && vatRate > 0) {
      // Calculate net amount by removing VAT from the gross total
      const netAmount = totalAmount / (1 + vatRate / 100);
      const vatAmount = totalAmount - netAmount;
      return { netAmount, vatAmount, totalAmount };
    } else {
      // If VAT is disabled, net amount equals total amount
      return { netAmount: totalAmount, vatAmount: 0, totalAmount };
    }
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

    const unitPrice = parsePrice(inventoryItem.price);
    const quantity = updatedLineItems[index].quantity || 1;

    updatedLineItems[index] = {
      ...updatedLineItems[index],
      item_id: inventoryItem.id,
      name: inventoryItem.name,
      description: inventoryItem.description || '',
      unit_price: unitPrice,
      total_price: quantity * unitPrice,
      category: inventoryItem.category,
      unit: inventoryItem.unit || 'unit'
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

  const handleAddPredefinedPackage = (packageData: PredefinedPackage) => {
    // Get translated content based on translatePackages setting
    const proposalTitle = translatePackages && packageData.proposalTitleTranslations[pdfLanguage] 
      ? packageData.proposalTitleTranslations[pdfLanguage] 
      : packageData.proposalTitle;
      
    const proposalDescription = translatePackages && packageData.proposalDescriptionTranslations[pdfLanguage] 
      ? packageData.proposalDescriptionTranslations[pdfLanguage] 
      : packageData.proposalDescription;
      
    const deliveryTerms = translatePackages && packageData.deliveryTermsTranslations[pdfLanguage] 
      ? packageData.deliveryTermsTranslations[pdfLanguage] 
      : packageData.deliveryTerms;
      
    const paymentTerms = translatePackages && packageData.paymentTermsTranslations[pdfLanguage] 
      ? packageData.paymentTermsTranslations[pdfLanguage] 
      : packageData.paymentTerms;
      
    const footerContent = translatePackages && packageData.footerContentTranslations[pdfLanguage] 
      ? packageData.footerContentTranslations[pdfLanguage] 
      : packageData.footerContent;

    // Create line items from package
    const newLineItems = packageData.lineItems.map(item => {
      const name = translatePackages && item.nameTranslations[pdfLanguage] 
        ? item.nameTranslations[pdfLanguage] 
        : item.name;
        
      const description = translatePackages && item.descriptionTranslations[pdfLanguage] 
        ? item.descriptionTranslations[pdfLanguage] 
        : item.description;
        
      const unit = translatePackages && item.unitTranslations[pdfLanguage] 
        ? item.unitTranslations[pdfLanguage] 
        : item.unit;

      return {
        id: uuidv4(),
        proposal_id: proposalData.id,
        name: name,
        description: description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
        unit: unit,
        category: item.category,
        created_at: new Date().toISOString()
      };
    });
    
    // Calculate totals with new line items
    const { netAmount, vatAmount, totalAmount } = calculateTotals(newLineItems, packageData.vatEnabled, packageData.vatRate);
    
    // Update the entire proposal with template data
    setProposalData(prev => ({
      ...prev,
      // Update proposal content
      proposalTitle,
      proposalDescription,
      deliveryTerms,
      paymentTerms,
      footerContent,
      
      // Update VAT settings
      vatEnabled: packageData.vatEnabled,
      vatRate: packageData.vatRate,
      
      // Replace line items
      lineItems: newLineItems,
      
      // Update calculated totals
      netAmount,
      vatAmount,
      totalAmount,
      amount: totalAmount.toFixed(2)
    }));
    
    toast({
      title: "Template applied",
      description: `${packageData.name} template has been applied to the proposal.`,
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
      
      // Save detailed proposal data with PDF language
      const savedDetailedProposals = localStorage.getItem("detailedProposals");
      const detailedProposals = savedDetailedProposals ? JSON.parse(savedDetailedProposals) : [];
      
      const detailedExistingIndex = detailedProposals.findIndex((p: any) => p.id === proposalData.id);
      const updatedProposalData = {
        ...proposalData,
        pdfLanguage: pdfLanguage, // Save PDF language instead of interface language
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
    
    // Prepare proposal data for PDF generation with PDF language
    const pdfProposalData = {
      ...proposalData,
      language: pdfLanguage, // Use PDF language for generation
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
    
    const success = await previewProposalPDF(pdfProposalData, pdfLanguage, translatePackages);
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
    
    // Prepare proposal data for PDF generation with PDF language
    const pdfProposalData = {
      ...proposalData,
      language: pdfLanguage, // Use PDF language for generation
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
    
    const success = await generateProposalPDF(pdfProposalData, pdfLanguage, `proposal-${proposalData.number}.pdf`, translatePackages);
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

  if (loading || inventoryLoading) {
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
            {/* Move title to upper left corner */}
            <h1 className="text-lg font-semibold mb-4">
              {isNewProposal ? "Create New Proposal" : `Edit Proposal ${proposalData.number}`}
            </h1>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/proposals")}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Proposals
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Languages size={16} />
                  <label className="text-sm font-medium">PDF Language:</label>
                  <Select value={pdfLanguage} onValueChange={setPdfLanguage}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Translation Toggle for Predefined Packages */}
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  <Switch
                    id="translatePackages"
                    checked={translatePackages}
                    onCheckedChange={setTranslatePackages}
                  />
                  <Label htmlFor="translatePackages" className="text-sm font-medium">
                    Translate Packages
                  </Label>
                </div>
                
                {/* Payment Data Toggle */}
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  <Switch
                    id="includePaymentData"
                    checked={proposalData.includePaymentData}
                    onCheckedChange={(checked) => 
                      setProposalData(prev => ({ ...prev, includePaymentData: checked }))
                    }
                  />
                  <Label htmlFor="includePaymentData" className="text-sm font-medium">
                    Include Payment Data in PDF
                  </Label>
                </div>
                
                <TemplateManager 
                  currentProposalData={proposalData}
                  onLoadTemplate={handleLoadTemplate}
                />
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
                    <div className="flex gap-2 items-center">
                      <Button onClick={handleAddLineItem} size="sm" variant="outline">
                        <PlusCircle size={16} className="mr-2" />
                        Add Line Item
                      </Button>
                      <Select onValueChange={(value) => {
                        const packageData = PREDEFINED_PACKAGES.find(p => p.id === value);
                        if (packageData) handleAddPredefinedPackage(packageData);
                      }}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Add Predefined Package" />
                        </SelectTrigger>
                        <SelectContent>
                          {PREDEFINED_PACKAGES.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {translatePackages && pkg.nameTranslations[pdfLanguage] 
                                ? pkg.nameTranslations[pdfLanguage] 
                                : pkg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                                inventoryItems={inventoryData || []}
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

              {/* Payment Data - Updated Section */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Payment Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        value={proposalData.iban}
                        onChange={(e) => setProposalData(prev => ({ ...prev, iban: e.target.value }))}
                        placeholder="BE79967023897833"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bic">BIC</Label>
                      <Input
                        id="bic"
                        value={proposalData.bic}
                        onChange={(e) => setProposalData(prev => ({ ...prev, bic: e.target.value }))}
                        placeholder="TRWIBEB1XXX"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="blzKonto">BLZ KONTO</Label>
                      <Input
                        id="blzKonto"
                        value={proposalData.blzKonto}
                        onChange={(e) => setProposalData(prev => ({ ...prev, blzKonto: e.target.value }))}
                        placeholder="967 KONTO: 967023897833"
                      />
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
