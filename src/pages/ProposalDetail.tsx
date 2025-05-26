import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Proposal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
import { generateProposalPDF, previewProposalPDF } from "@/utils/proposalUtils";
import TemplateManager from "@/components/proposals/TemplateManager";

interface ProposalDetailParams {
  id?: string;
}

const ProposalDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<ProposalDetailParams>();
  const isNewProposal = !id;

  const [proposal, setProposal] = useState<Proposal>({
    id: uuidv4(),
    reference: "",
    number: "",
    customer: "",
    subject: "",
    amount: "0.00",
    status: "Draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: "EUR",
    vatEnabled: true,
  });

  useEffect(() => {
    if (!isNewProposal && id) {
      loadProposal(id);
    } else {
      // Set a default number for new proposals
      setProposal(prev => ({ ...prev, number: generateProposalNumber() }));
    }
  }, [id, isNewProposal]);

  const generateProposalNumber = () => {
    const prefix = "AN";
    const randomNumber = Math.floor(Math.random() * 9999);
    return `${prefix}-${String(randomNumber).padStart(4, '0')}`;
  };

  const loadProposal = (id: string) => {
    try {
      const savedProposals = localStorage.getItem("proposals");
      if (savedProposals) {
        const proposals: Proposal[] = JSON.parse(savedProposals);
        const foundProposal = proposals.find((p) => p.id === id);
        if (foundProposal) {
          setProposal(foundProposal);
        } else {
          toast({
            title: "Proposal not found",
            description: "The requested proposal does not exist.",
            variant: "destructive",
          });
          navigate("/proposals");
        }
      } else {
        toast({
          title: "No proposals found",
          description: "No proposals exist in the system.",
          variant: "destructive",
        });
        navigate("/proposals");
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
      toast({
        title: "Error",
        description: "Failed to load proposal.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProposal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCurrencyChange = (value: string) => {
    setProposal((prev) => ({
      ...prev,
      currency: value,
    }));
  };

  const handleVatToggle = (checked: boolean) => {
    setProposal((prev) => ({
      ...prev,
      vatEnabled: checked,
    }));
  };

  const handleStatusChange = (status: string) => {
    setProposal((prev) => ({
      ...prev,
      status: status,
    }));
  };

  const handleSave = () => {
    try {
      const savedProposals = localStorage.getItem("proposals");
      let proposals: Proposal[] = [];
      if (savedProposals) {
        proposals = JSON.parse(savedProposals);
      }

      if (isNewProposal) {
        proposals.push(proposal);
        toast({
          title: "Proposal created",
          description: "Proposal has been created successfully.",
        });
      } else {
        proposals = proposals.map((p) => (p.id === proposal.id ? proposal : p));
        toast({
          title: "Proposal updated",
          description: "Proposal has been updated successfully.",
        });
      }

      localStorage.setItem("proposals", JSON.stringify(proposals));
      navigate("/proposals");
    } catch (error) {
      console.error("Error saving proposal:", error);
      toast({
        title: "Error",
        description: "Failed to save proposal.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const result = await generateProposalPDF({
        ...proposal,
        netAmount: parseFloat(proposal.amount),
        vatRate: 19, // Default VAT rate
        lineItems: [], // Empty array since we don't have detailed line items
      }, 'en', `proposal-${proposal.number}.pdf`);

      if (result) {
        toast({
          title: "Proposal downloaded",
          description: `Proposal ${proposal.number} has been downloaded as PDF.`,
        });
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download failed",
        description: "Failed to download proposal as PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handlePreview = async () => {
    try {
      await previewProposalPDF({
        ...proposal,
        netAmount: parseFloat(proposal.amount),
        vatRate: 19,
        lineItems: [],
      });
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast({
        title: "Preview failed",
        description: "Failed to preview proposal as PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/proposals")}
                >
                  <ArrowLeft size={20} />
                </Button>
                <h1 className="text-2xl font-bold">
                  {isNewProposal ? "Create New Proposal" : `Edit Proposal ${proposal?.number}`}
                </h1>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handlePreview}
                  className="flex items-center gap-2"
                >
                  <Eye size={16} />
                  Preview PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleGeneratePDF}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download PDF
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save size={16} />
                  {isNewProposal ? "Create Proposal" : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Template Manager Section */}
            <div className="mb-6">
              <TemplateManager />
            </div>

            {/* Proposal Form */}
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number">Number</Label>
                    <Input
                      type="text"
                      id="number"
                      name="number"
                      value={proposal.number}
                      onChange={handleInputChange}
                      readOnly={!isNewProposal}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      type="text"
                      id="reference"
                      name="reference"
                      value={proposal.reference}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Input
                      type="text"
                      id="customer"
                      name="customer"
                      value={proposal.customer}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      type="text"
                      id="subject"
                      name="subject"
                      value={proposal.subject}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      type="number"
                      id="amount"
                      name="amount"
                      value={proposal.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={proposal.currency} onValueChange={handleCurrencyChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="vat">Enable VAT</Label>
                  <Switch
                    id="vat"
                    checked={proposal.vatEnabled}
                    onCheckedChange={handleVatToggle}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={proposal.content || ""}
                    onChange={handleInputChange}
                    placeholder="Proposal content..."
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={proposal.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                      <SelectItem value="Revised">Revised</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default ProposalDetail;
