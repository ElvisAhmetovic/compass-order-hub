import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Proposal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, FileEdit, Trash2, Download, File, CheckCircle2, XCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { generateProposalPDF } from "@/utils/proposalUtils";

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
  
  const loadProposals = () => {
    try {
      const savedProposals = localStorage.getItem("proposals");
      if (savedProposals) {
        const proposals = JSON.parse(savedProposals);
        
        // Load detailed proposals to get complete data
        const savedDetailedProposals = localStorage.getItem("detailedProposals");
        let detailedProposals = [];
        if (savedDetailedProposals) {
          detailedProposals = JSON.parse(savedDetailedProposals);
        }
        
        // Merge basic and detailed proposal data
        const mergedProposals = proposals.map((basicProposal: any) => {
          const detailedProposal = detailedProposals.find((dp: any) => dp.id === basicProposal.id);
          return {
            ...basicProposal,
            // Use customer name from detailed data if available
            customer: detailedProposal?.customerName || detailedProposal?.customer || basicProposal.customer,
            // Ensure currency is available
            currency: detailedProposal?.currency || basicProposal.currency || 'EUR',
            // Ensure VAT settings are available
            vatEnabled: detailedProposal?.vatEnabled !== undefined ? detailedProposal.vatEnabled : basicProposal.vatEnabled
          };
        });
        
        setProposals(mergedProposals);
      } else {
        // Set some mock data if nothing exists
        const mockProposals: Proposal[] = [
          {
            id: uuidv4(),
            reference: "REF-2025-001",
            number: "AN-9984",
            customer: "Acme Corporation",
            subject: "Website Redesign",
            amount: "2500.00",
            status: "Draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            currency: 'EUR',
            vatEnabled: true
          },
          {
            id: uuidv4(),
            reference: "REF-2025-002",
            number: "AN-9985",
            customer: "TechStart Inc.",
            subject: "Mobile App Development",
            amount: "5000.00",
            status: "Sent",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            currency: 'USD',
            vatEnabled: false
          }
        ];
        setProposals(mockProposals);
        localStorage.setItem("proposals", JSON.stringify(mockProposals));
      }
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
  };

  useEffect(() => {
    loadProposals();
  }, []);

  // Reload proposals when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      loadProposals();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', loadProposals);
    
    // Add a special listener for new proposals
    const checkForNewProposals = () => {
      const savedProposals = localStorage.getItem("proposals");
      if (savedProposals) {
        const parsedProposals = JSON.parse(savedProposals);
        if (parsedProposals.length !== proposals.length) {
          loadProposals();
        }
      }
    };
    
    // Check every few seconds for new proposals
    const interval = setInterval(checkForNewProposals, 3000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', loadProposals);
      clearInterval(interval);
    };
  }, [proposals.length]);

  const handleDeleteProposal = (id: string) => {
    const updatedProposals = proposals.filter(p => p.id !== id);
    setProposals(updatedProposals);
    localStorage.setItem("proposals", JSON.stringify(updatedProposals));
    
    toast({
      title: "Proposal deleted",
      description: "Proposal has been deleted successfully.",
    });
  };

  const handleCreateProposal = () => {
    navigate("/proposals/new");
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const updatedProposals = proposals.map(proposal => {
      if (proposal.id === id) {
        return {
          ...proposal,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
      }
      return proposal;
    });
    
    setProposals(updatedProposals);
    localStorage.setItem("proposals", JSON.stringify(updatedProposals));
    
    toast({
      title: "Status updated",
      description: `Proposal status changed to ${newStatus}`,
    });
  };

  const handleDownloadProposal = async (proposal: Proposal) => {
    try {
      // Load detailed proposal data for PDF generation
      const savedDetailedProposals = localStorage.getItem("detailedProposals");
      let detailedProposal = null;
      
      if (savedDetailedProposals) {
        const detailedProposals = JSON.parse(savedDetailedProposals);
        detailedProposal = detailedProposals.find((p: any) => p.id === proposal.id);
      }
      
      // Create comprehensive proposal data object for PDF generation
      const proposalData = {
        ...proposal,
        ...detailedProposal,
        // Ensure basic fields are available
        number: proposal.number,
        customer: detailedProposal?.customerName || proposal.customer,
        subject: proposal.subject,
        reference: proposal.reference,
        date: proposal.created_at,
        amount: proposal.amount,
        
        // Customer details
        customerName: detailedProposal?.customerName || proposal.customer,
        customerAddress: detailedProposal?.customerAddress || '',
        customerEmail: detailedProposal?.customerEmail || '',
        customerCountry: detailedProposal?.customerCountry || '',
        customerRef: detailedProposal?.customerRef || proposal.reference,
        
        // Contact details
        yourContact: detailedProposal?.internalContact || detailedProposal?.yourContact || 'Thomas Klein',
        
        // Proposal content
        proposalTitle: detailedProposal?.proposalTitle || proposal.subject,
        proposalDescription: detailedProposal?.proposalDescription || 'Thank you for your enquiry.',
        content: detailedProposal?.content || '',
        
        // Financial data
        netAmount: detailedProposal?.netAmount || parseFloat(proposal.amount) || 0,
        vatEnabled: detailedProposal?.vatEnabled !== undefined ? detailedProposal.vatEnabled : (proposal.vatEnabled || false),
        vatRate: detailedProposal?.vatRate || 19,
        vatAmount: detailedProposal?.vatAmount || 0,
        totalAmount: detailedProposal?.totalAmount || parseFloat(proposal.amount) || 0,
        
        // Line items
        lineItems: detailedProposal?.lineItems || [],
        
        // Terms
        deliveryTerms: detailedProposal?.deliveryTerms || '7 days after receipt of invoice',
        paymentTerms: detailedProposal?.paymentTerms || 'By placing your order you agree to pay for the services included in this offer within 7 days of receipt of the invoice.',
        termsAndConditions: detailedProposal?.termsAndConditions || '',
        footerContent: detailedProposal?.footerContent || '',
        
        // Currency
        currency: proposal.currency || 'EUR'
      };

      console.log('Downloading proposal with data:', proposalData);

      // Generate and download PDF
      const result = await generateProposalPDF(proposalData, 'en', `proposal-${proposal.number}.pdf`);
      
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
              <Button onClick={handleCreateProposal} className="flex items-center gap-2">
                <PlusCircle size={16} />
                Create Proposal
              </Button>
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
                          <TableCell>{proposal.customer}</TableCell>
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
