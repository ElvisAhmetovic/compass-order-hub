
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Proposal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, FileEdit, Trash2, Download, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

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
        setProposals(JSON.parse(savedProposals));
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
  }, [toast]);

  // Reload proposals when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      loadProposals();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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
                          <TableCell>€{parseFloat(proposal.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              proposal.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                              proposal.status === "Sent" ? "bg-blue-100 text-blue-800" :
                              proposal.status === "Accepted" ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {proposal.status}
                            </span>
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
