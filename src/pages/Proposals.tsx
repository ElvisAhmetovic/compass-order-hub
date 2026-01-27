import React, { useState, useEffect, useCallback } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, FileEdit, Trash2, Download, File, CheckCircle2, XCircle, Send, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { generateProposalPDF } from "@/utils/proposalUtils";
import { proposalService, Proposal } from "@/services/proposalService";

// Define the available proposal statuses
export const PROPOSAL_STATUSES = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
  "Revised"
];

// Function to get currency symbol
const getCurrencySymbol = (currency: string = 'EUR') => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'EUR':
    default:
      return '€';
  }
};

const Proposals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  
  const loadProposals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await proposalService.getProposals();
      setProposals(data);
    } catch (error) {
      console.error("Error loading proposals:", error);
      toast({
        title: "Error",
        description: "Failed to load proposals.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  // Reload proposals when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      loadProposals();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', loadProposals);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', loadProposals);
    };
  }, [loadProposals]);

  const handleDeleteProposal = async (id: string) => {
    try {
      await proposalService.deleteProposal(id);
      setProposals(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Proposal deleted",
        description: "Proposal has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting proposal:", error);
      toast({
        title: "Error",
        description: "Failed to delete proposal.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProposal = () => {
    navigate("/proposals/new");
  };

  const handleRefresh = () => {
    loadProposals();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await proposalService.updateProposal(id, { status: newStatus });
      
      setProposals(prev => prev.map(proposal => {
        if (proposal.id === id) {
          return {
            ...proposal,
            status: newStatus,
            updated_at: new Date().toISOString()
          };
        }
        return proposal;
      }));
      
      toast({
        title: "Status updated",
        description: `Proposal status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadProposal = async (proposal: Proposal) => {
    try {
      // Load full proposal data for PDF generation
      const fullProposal = await proposalService.getProposal(proposal.id);
      
      if (!fullProposal) {
        throw new Error('Proposal not found');
      }
      
      // Create comprehensive proposal data object for PDF generation
      const proposalData = {
        ...fullProposal,
        // Ensure basic fields are available
        number: fullProposal.number,
        customer: fullProposal.customer_name || fullProposal.customer,
        subject: fullProposal.subject,
        reference: fullProposal.reference,
        date: fullProposal.created_at,
        amount: fullProposal.amount,
        
        // Customer details
        customerName: fullProposal.customer_name || fullProposal.customer,
        customerAddress: fullProposal.customer_address || '',
        customerEmail: fullProposal.customer_email || '',
        customerCountry: fullProposal.customer_country || '',
        customerRef: fullProposal.customer_ref || fullProposal.reference,
        
        // Contact details
        yourContact: fullProposal.internal_contact || fullProposal.your_contact || 'Thomas Klein',
        
        // Proposal content
        proposalTitle: fullProposal.proposal_title || fullProposal.subject,
        proposalDescription: fullProposal.proposal_description || 'Thank you for your enquiry.',
        content: fullProposal.content || '',
        
        // Financial data
        netAmount: fullProposal.net_amount || parseFloat(fullProposal.amount) || 0,
        vatEnabled: fullProposal.vat_enabled !== undefined ? fullProposal.vat_enabled : true,
        vatRate: fullProposal.vat_rate || 19,
        vatAmount: fullProposal.vat_amount || 0,
        totalAmount: fullProposal.total_amount || parseFloat(fullProposal.amount) || 0,
        
        // Line items
        lineItems: fullProposal.lineItems || [],
        
        // Terms
        deliveryTerms: fullProposal.delivery_terms || '7 days after receipt of invoice',
        paymentTerms: fullProposal.payment_terms || 'By placing your order you agree to pay for the services included in this offer within 7 days of receipt of the invoice.',
        termsAndConditions: fullProposal.terms_and_conditions || '',
        footerContent: fullProposal.footer_content || '',
        
        // Currency
        currency: fullProposal.currency || 'EUR'
      };

      console.log('Downloading proposal with data:', proposalData);

      // Generate and download PDF
      const result = await generateProposalPDF(proposalData, fullProposal.pdf_language || 'en', `proposal-${proposal.number}.pdf`);
      
      if (result) {
        toast({
          title: "Proposal downloaded",
          description: `Proposal ${proposal.number} has been downloaded as PDF.`,
        });
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('Error downloading proposal:', error);
      toast({
        title: "Download failed",
        description: "Failed to download proposal as PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Accepted":
        return <CheckCircle2 size={14} className="mr-1.5 text-green-600" />;
      case "Rejected":
        return <XCircle size={14} className="mr-1.5 text-red-600" />;
      case "Sent":
        return <Send size={14} className="mr-1.5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Expired":
        return "bg-gray-100 text-gray-800";
      case "Revised":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredProposals = proposals.filter(proposal => 
    proposal.customer.toLowerCase().includes(filterText.toLowerCase()) || 
    proposal.number.toLowerCase().includes(filterText.toLowerCase()) ||
    proposal.reference.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Proposals</h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </Button>
                <Button onClick={handleCreateProposal} className="flex items-center gap-2">
                  <PlusCircle size={16} />
                  Create Proposal
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Manage Proposals</CardTitle>
                  <div className="w-72">
                    <Input
                      placeholder="Search proposals..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">Loading proposals...</TableCell>
                      </TableRow>
                    ) : filteredProposals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">No proposals found</TableCell>
                      </TableRow>
                    ) : (
                      filteredProposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <File size={16} className="text-gray-400" />
                              <a 
                                href={`/proposals/${proposal.id}`}
                                className="text-primary hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/proposals/${proposal.id}`);
                                }}
                              >
                                {proposal.number}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>{proposal.customer_name || proposal.customer}</TableCell>
                          <TableCell>{proposal.subject}</TableCell>
                          <TableCell>{proposal.reference}</TableCell>
                          <TableCell>
                            {getCurrencySymbol(proposal.currency)}
                            {parseFloat(proposal.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                                  getStatusColor(proposal.status)}`}>
                                  {getStatusIcon(proposal.status)} {proposal.status}
                                </span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {PROPOSAL_STATUSES.map((status) => (
                                  <DropdownMenuItem 
                                    key={status} 
                                    onClick={() => handleUpdateStatus(proposal.id, status)}
                                    className="cursor-pointer"
                                  >
                                    <span className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(status)}`} />
                                    {status}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => navigate(`/proposals/${proposal.id}`)}
                                title="Edit"
                              >
                                <FileEdit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteProposal(proposal.id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownloadProposal(proposal)}
                                title="Download"
                              >
                                <Download size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Proposals;
