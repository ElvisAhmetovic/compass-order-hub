import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, Eye, Download, Save } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { 
  PROPOSAL_STATUSES, 
  SUPPORTED_LANGUAGES, 
  generateProposalPDF, 
  previewProposalPDF,
  getTranslation 
} from "@/utils/proposalUtils";
import { useToast } from "@/hooks/use-toast";

interface LineItem {
  id: string;
  productServiceName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ProposalData {
  // Basic Information
  number: string;
  reference: string;
  subject: string;
  status: string;
  currency: string;
  date: string;
  time: string;
  language: string;
  
  // Company Logo
  companyLogo: string;
  logoSize: string;
  
  // Customer Information
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  country: string;
  customerReference: string;
  internalContactPerson: string;
  
  // Proposal Content
  proposalTitle: string;
  proposalDescription: string;
  additionalContent: string;
  
  // Line Items
  lineItems: LineItem[];
  
  // VAT & Pricing
  vatEnabled: boolean;
  vatRate: number;
  
  // Terms & Conditions
  deliveryTerms: string;
  paymentTerms: string;
  additionalTerms: string;
  footerContent: string;
  
  // Payment Data
  accountNumber: string;
  accountName: string;
  paymentMethod: string;
}

const ProposalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage(); // UI translations only
  const { toast } = useToast();
  
  const isNewProposal = id === 'new' || !id;

  const [proposalData, setProposalData] = useState<ProposalData>({
    // Basic Information
    number: isNewProposal ? `PRO-${Date.now()}` : "",
    reference: "",
    subject: "",
    status: "draft",
    currency: "EUR",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    language: "en",
    
    // Company Logo
    companyLogo: "",
    logoSize: "medium",
    
    // Customer Information
    customerName: "",
    customerAddress: "",
    customerEmail: "",
    country: "",
    customerReference: "",
    internalContactPerson: "",
    
    // Proposal Content
    proposalTitle: "",
    proposalDescription: "",
    additionalContent: "",
    
    // Line Items
    lineItems: [],
    
    // VAT & Pricing
    vatEnabled: true,
    vatRate: 20,
    
    // Terms & Conditions
    deliveryTerms: "",
    paymentTerms: "",
    additionalTerms: "",
    footerContent: "",
    
    // Payment Data
    accountNumber: "",
    accountName: "",
    paymentMethod: ""
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNewProposal && id) {
      // Simulate fetching proposal data
      setTimeout(() => {
        setProposalData({
          number: id,
          reference: "REF-123",
          subject: "Sample Proposal",
          status: "pending",
          currency: "USD",
          date: "2024-01-20",
          time: "14:30",
          language: "en",
          companyLogo: "",
          logoSize: "medium",
          customerName: "Acme Corp",
          customerAddress: "123 Main St",
          customerEmail: "info@acme.com",
          country: "USA",
          customerReference: "Contact: John Doe",
          internalContactPerson: "Jane Smith",
          proposalTitle: "Software Development",
          proposalDescription: "Custom software solution",
          additionalContent: "Additional details here",
          lineItems: [
            { id: "1", productServiceName: "Development", description: "Coding", quantity: 100, unitPrice: 50, total: 5000 },
            { id: "2", productServiceName: "Design", description: "UI/UX", quantity: 50, unitPrice: 80, total: 4000 }
          ],
          vatEnabled: true,
          vatRate: 20,
          deliveryTerms: "30 days",
          paymentTerms: "Net 30",
          additionalTerms: "As agreed",
          footerContent: "Thank you for your business!",
          accountNumber: "123456789",
          accountName: "My Account",
          paymentMethod: "Wire Transfer"
        });
      }, 500);
    }
  }, [id, isNewProposal]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('successSaved'),
        description: isNewProposal ? 
          "New proposal has been created successfully." : 
          "Proposal has been updated successfully.",
      });
      
      if (isNewProposal) {
        navigate(`/proposals/${proposalData.number}`);
      }
    } catch (error) {
      toast({
        title: t('errorOccurred'),
        description: "Failed to save proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    previewProposalPDF(proposalData);
  };

  const handleDownload = () => {
    generateProposalPDF(proposalData);
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      productServiceName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setProposalData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setProposalData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeLineItem = (id: string) => {
    setProposalData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  const calculateTotals = () => {
    const netAmount = proposalData.lineItems.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = proposalData.vatEnabled ? netAmount * (proposalData.vatRate / 100) : 0;
    const totalAmount = netAmount + vatAmount;
    return { netAmount, vatAmount, totalAmount };
  };

  const { netAmount, vatAmount, totalAmount } = calculateTotals();

  const currencies = [
    { value: "EUR", label: "EUR (€)" },
    { value: "USD", label: "USD ($)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "BAM", label: "BAM (КМ)" }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            {/* Move title to upper left corner */}
            <h1 className="text-lg font-semibold mb-4">
              {isNewProposal ? getTranslation(proposalData.language, 'createNewProposal') : 
                `${getTranslation(proposalData.language, 'editProposal')} ${proposalData.number}`}
            </h1>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/proposals")}>
                  <ArrowLeft size={16} className="mr-2" />
                  {getTranslation(proposalData.language, 'backToProposals')}
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye size={16} className="mr-2" />
                    {getTranslation(proposalData.language, 'preview')}
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download size={16} className="mr-2" />
                    {getTranslation(proposalData.language, 'downloadPdf')}
                  </Button>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save size={16} className="mr-2" />
                  {isSaving ? getTranslation(proposalData.language, 'saving') : getTranslation(proposalData.language, 'save')}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">{getTranslation(proposalData.language, 'basicInformation')}</TabsTrigger>
                <TabsTrigger value="customer">{getTranslation(proposalData.language, 'customerInformation')}</TabsTrigger>
                <TabsTrigger value="content">{getTranslation(proposalData.language, 'proposalContent')}</TabsTrigger>
                <TabsTrigger value="products">{getTranslation(proposalData.language, 'productsServices')}</TabsTrigger>
                <TabsTrigger value="pricing">{getTranslation(proposalData.language, 'vatPricing')}</TabsTrigger>
                <TabsTrigger value="terms">{getTranslation(proposalData.language, 'termsConditions')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTranslation(proposalData.language, 'basicInformation')}</CardTitle>
                    <CardDescription>Basic proposal information and settings</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="proposalNumber">{getTranslation(proposalData.language, 'proposalNumber')}</Label>
                      <Input
                        id="proposalNumber"
                        value={proposalData.number}
                        onChange={(e) => setProposalData(prev => ({ ...prev, number: e.target.value }))}
                        disabled={!isNewProposal}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference">{getTranslation(proposalData.language, 'reference')}</Label>
                      <Input
                        id="reference"
                        value={proposalData.reference}
                        onChange={(e) => setProposalData(prev => ({ ...prev, reference: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">{getTranslation(proposalData.language, 'subject')}</Label>
                      <Input
                        id="subject"
                        value={proposalData.subject}
                        onChange={(e) => setProposalData(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">{getTranslation(proposalData.language, 'status')}</Label>
                      <Select value={proposalData.status} onValueChange={(value) => setProposalData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPOSAL_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">{getTranslation(proposalData.language, 'currency')}</Label>
                      <Select value={proposalData.currency} onValueChange={(value) => setProposalData(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="proposalDate">{getTranslation(proposalData.language, 'proposalDate')}</Label>
                      <Input
                        id="proposalDate"
                        type="date"
                        value={proposalData.date}
                        onChange={(e) => setProposalData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="proposalTime">{getTranslation(proposalData.language, 'proposalTime')}</Label>
                      <Input
                        id="proposalTime"
                        type="time"
                        value={proposalData.time}
                        onChange={(e) => setProposalData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">{getTranslation(proposalData.language, 'language')}</Label>
                      <Select value={proposalData.language} onValueChange={(value) => setProposalData(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customer" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTranslation(proposalData.language, 'customerInformation')}</CardTitle>
                    <CardDescription>Enter customer details for the proposal</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">{getTranslation(proposalData.language, 'customerName')}</Label>
                      <Input
                        id="customerName"
                        value={proposalData.customerName}
                        onChange={(e) => setProposalData(prev => ({ ...prev, customerName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerAddress">{getTranslation(proposalData.language, 'customerAddress')}</Label>
                      <Input
                        id="customerAddress"
                        value={proposalData.customerAddress}
                        onChange={(e) => setProposalData(prev => ({ ...prev, customerAddress: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">{getTranslation(proposalData.language, 'customerEmail')}</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={proposalData.customerEmail}
                        onChange={(e) => setProposalData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">{getTranslation(proposalData.language, 'country')}</Label>
                      <Input
                        id="country"
                        value={proposalData.country}
                        onChange={(e) => setProposalData(prev => ({ ...prev, country: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerReference">{getTranslation(proposalData.language, 'customerReference')}</Label>
                      <Input
                        id="customerReference"
                        value={proposalData.customerReference}
                        onChange={(e) => setProposalData(prev => ({ ...prev, customerReference: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="internalContactPerson">{getTranslation(proposalData.language, 'internalContactPerson')}</Label>
                      <Input
                        id="internalContactPerson"
                        value={proposalData.internalContactPerson}
                        onChange={(e) => setProposalData(prev => ({ ...prev, internalContactPerson: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTranslation(proposalData.language, 'proposalContent')}</CardTitle>
                    <CardDescription>Define the core content of the proposal</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="proposalTitle">{getTranslation(proposalData.language, 'proposalTitle')}</Label>
                      <Input
                        id="proposalTitle"
                        value={proposalData.proposalTitle}
                        onChange={(e) => setProposalData(prev => ({ ...prev, proposalTitle: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="proposalDescription">{getTranslation(proposalData.language, 'proposalDescription')}</Label>
                      <Textarea
                        id="proposalDescription"
                        value={proposalData.proposalDescription}
                        onChange={(e) => setProposalData(prev => ({ ...prev, proposalDescription: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="additionalContent">{getTranslation(proposalData.language, 'additionalContent')}</Label>
                      <Textarea
                        id="additionalContent"
                        value={proposalData.additionalContent}
                        onChange={(e) => setProposalData(prev => ({ ...prev, additionalContent: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTranslation(proposalData.language, 'productsServices')}</CardTitle>
                    <CardDescription>List the products and services included in this proposal</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getTranslation(proposalData.language, 'productServiceName')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getTranslation(proposalData.language, 'description')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getTranslation(proposalData.language, 'quantity')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getTranslation(proposalData.language, 'unitPrice')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getTranslation(proposalData.language, 'total')}</th>
                            <th className="relative px-6 py-3">
                              <span className="sr-only">{getTranslation(proposalData.language, 'actions')}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {proposalData.lineItems.map(item => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Input
                                  value={item.productServiceName}
                                  onChange={(e) => updateLineItem(item.id, 'productServiceName', e.target.value)}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{item.total}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      {getTranslation(proposalData.language, 'addLineItem')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTranslation(proposalData.language, 'vatPricing')}</CardTitle>
                    <CardDescription>Configure VAT and pricing details</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="vatEnabled">{getTranslation(proposalData.language, 'vatEnabled')}</Label>
                      <Switch
                        id="vatEnabled"
                        checked={proposalData.vatEnabled}
                        onCheckedChange={(checked) => setProposalData(prev => ({ ...prev, vatEnabled: checked }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vatRate">{getTranslation(proposalData.language, 'vatRate')}</Label>
                      <Input
                        id="vatRate"
                        type="number"
                        value={proposalData.vatRate}
                        onChange={(e) => setProposalData(prev => ({ ...prev, vatRate: Number(e.target.value) }))}
                        disabled={!proposalData.vatEnabled}
                      />
                    </div>
                    <div>
                      <Label htmlFor="netAmount">{getTranslation(proposalData.language, 'netAmount')}</Label>
                      <Input
                        id="netAmount"
                        value={netAmount.toFixed(2)}
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalAmount">{getTranslation(proposalData.language, 'totalAmount')}</Label>
                      <Input
                        id="totalAmount"
                        value={totalAmount.toFixed(2)}
                        disabled
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTranslation(proposalData.language, 'termsConditions')}</CardTitle>
                    <CardDescription>Set terms and conditions for the proposal</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="deliveryTerms">{getTranslation(proposalData.language, 'deliveryTerms')}</Label>
                      <Textarea
                        id="deliveryTerms"
                        value={proposalData.deliveryTerms}
                        onChange={(e) => setProposalData(prev => ({ ...prev, deliveryTerms: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentTerms">{getTranslation(proposalData.language, 'paymentTerms')}</Label>
                      <Textarea
                        id="paymentTerms"
                        value={proposalData.paymentTerms}
                        onChange={(e) => setProposalData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="additionalTerms">{getTranslation(proposalData.language, 'additionalTerms')}</Label>
                      <Textarea
                        id="additionalTerms"
                        value={proposalData.additionalTerms}
                        onChange={(e) => setProposalData(prev => ({ ...prev, additionalTerms: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="footerContent">{getTranslation(proposalData.language, 'footerContent')}</Label>
                      <Textarea
                        id="footerContent"
                        value={proposalData.footerContent}
                        onChange={(e) => setProposalData(prev => ({ ...prev, footerContent: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default ProposalDetail;
