import { useState, useEffect } from 'react';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Proposal, ProposalStatus, ProposalFilterOptions } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import ProposalRow from './ProposalRow';
import ProposalsPagination from './ProposalsPagination';

interface ProposalsTableProps {
  statusFilter: ProposalStatus;
  filterOptions: ProposalFilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<ProposalFilterOptions>>;
  refreshTrigger: number;
}

const ProposalsTable: React.FC<ProposalsTableProps> = ({ 
  statusFilter, 
  filterOptions,
  setFilterOptions,
  refreshTrigger 
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { toast } = useToast();
  
  console.log("ProposalsTable rendered with status filter:", statusFilter);
  
  // Fetch proposals
  useEffect(() => {
    const fetchProposals = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching proposals...");
        
        // First try to fetch from Supabase
        const { data: supabaseData, error } = await supabase
          .from('proposals')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }

        if (supabaseData && supabaseData.length > 0) {
          console.log("Received proposals from Supabase:", supabaseData);
          setProposals(supabaseData as Proposal[]);
        } else {
          // As a fallback, use mock data
          console.log("No data from Supabase, using mock data");
          setProposals(mockProposals);
        }
      } catch (error) {
        console.error("Error fetching proposals:", error);
        toast({
          title: "Error",
          description: "Failed to load proposals",
          variant: "destructive"
        });
        // Use mock data as a fallback
        setProposals(mockProposals);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProposals();
  }, [refreshTrigger, toast]);
  
  // Apply filters
  useEffect(() => {
    console.log("Filtering proposals with status:", statusFilter);
    let filtered = [...proposals];
    
    // Filter by status
    if (statusFilter && statusFilter !== 'All') {
      console.log(`Filtering by status: ${statusFilter}`);
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }
    
    // Filter by search term
    if (filterOptions.searchTerm) {
      const searchLower = filterOptions.searchTerm.toLowerCase();
      filtered = filtered.filter(proposal => 
        proposal.customer.toLowerCase().includes(searchLower) || 
        proposal.reference.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by date range
    if (filterOptions.dateRange.from || filterOptions.dateRange.to) {
      filtered = filtered.filter(proposal => {
        const createdAt = new Date(proposal.created_at);
        
        if (filterOptions.dateRange.from && filterOptions.dateRange.to) {
          return createdAt >= filterOptions.dateRange.from && createdAt <= filterOptions.dateRange.to;
        } else if (filterOptions.dateRange.from) {
          return createdAt >= filterOptions.dateRange.from;
        } else if (filterOptions.dateRange.to) {
          return createdAt <= filterOptions.dateRange.to;
        }
        
        return true;
      });
    }
    
    console.log(`Filtered ${proposals.length} proposals to ${filtered.length}`);
    setFilteredProposals(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [proposals, statusFilter, filterOptions, rowsPerPage]);
  
  // Get current page proposals
  const indexOfLastProposal = currentPage * rowsPerPage;
  const indexOfFirstProposal = indexOfLastProposal - rowsPerPage;
  const currentProposals = filteredProposals.slice(indexOfFirstProposal, indexOfLastProposal);
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterOptions(prev => ({
      ...prev,
      searchTerm: e.target.value
    }));
  };
  
  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1); // Reset to first page
  };
  
  const exportPDF = () => {
    toast({
      title: "Export Started",
      description: "Your PDF is being generated",
    });
    // In a real app, implement PDF export
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    console.log(`Status change in table for proposal ${id} to ${newStatus}`);
    
    // Update the proposal status in the state
    setProposals(prevProposals => 
      prevProposals.map(proposal => 
        proposal.id === id ? { ...proposal, status: newStatus as ProposalStatus } : proposal
      )
    );
    
    // No need to re-fetch as we're already updating state
  };
  
  // Mock data for development and fallback
  const mockProposals: Proposal[] = [
    {
      id: '1',
      reference: 'AN-9981',
      number: 'AN-9981',
      customer: 'Züriwart AG',
      created_at: '2025-05-22T00:00:00Z',
      status: 'Unpaid',
      amount: '599.00 EUR',
    },
    {
      id: '2',
      reference: 'AN-9980',
      number: 'AN-9980',
      customer: 'ATEM - Event Agency',
      created_at: '2025-05-22T00:00:00Z',
      status: 'Unpaid',
      amount: '299.00 EUR',
    },
    {
      id: '3',
      reference: 'AN-9979',
      number: 'AN-9979',
      customer: 'HIKIMUS Event & Advertising Agency GmbH',
      created_at: '2025-05-22T00:00:00Z',
      status: 'Unpaid',
      amount: '299.00 EUR',
    },
    {
      id: '4',
      reference: 'AN-9978',
      number: 'AN-9978',
      customer: 'BS Gastro & Event Services GmbH',
      created_at: '2025-05-22T00:00:00Z',
      status: 'Unpaid',
      amount: '299.00 EUR',
    },
    {
      id: '5',
      reference: 'AN-9977',
      number: 'AN-9977',
      customer: 'BS Gastro & Event Services GmbH',
      created_at: '2025-05-21T00:00:00Z',
      status: 'Unpaid',
      amount: '299.00 EUR',
    },
    {
      id: '6',
      reference: 'AN-9976',
      number: 'AN-9976',
      customer: 'Parker & Williams Real Estate Services',
      created_at: '2025-05-21T00:00:00Z',
      status: 'Unpaid',
      amount: '299.00 EUR',
    },
    {
      id: '7',
      reference: 'AN-9975',
      number: 'AN-9975',
      customer: 'Parker & Williams Real Estate Services',
      created_at: '2025-05-21T00:00:00Z',
      status: 'Unpaid',
      amount: '299.00 EUR',
    },
    {
      id: '8',
      reference: 'AN-9974',
      number: 'AN-9974',
      customer: 'Larmer Bygg AB',
      created_at: '2025-05-21T00:00:00Z',
      status: 'Unpaid',
      amount: '249.00 EUR',
    },
    {
      id: '9',
      reference: 'AN-9973',
      number: 'AN-9973',
      customer: 'tbevents.nl',
      created_at: '2025-05-21T00:00:00Z',
      status: 'Unpaid',
      amount: '750.00 EUR',
    }
  ];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (filteredProposals.length === 0) {
    return (
      <div className="p-8 text-center border rounded-md">
        <p className="text-muted-foreground text-lg">No proposals found.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Search proposals..."
            value={filterOptions.searchTerm}
            onChange={handleSearch}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1">
              Export <ArrowDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPDF}>
              PDF List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>No.</TableHead>
              <TableHead>Customer / Invoice Header</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount (gross)</TableHead>
              <TableHead className="w-[50px]">Export</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProposals.map((proposal) => (
              <ProposalRow 
                key={proposal.id} 
                proposal={proposal} 
                onStatusChange={handleStatusChange}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {indexOfFirstProposal + 1} - {Math.min(indexOfLastProposal, filteredProposals.length)} of {filteredProposals.length} entries
        </div>
        <ProposalsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default ProposalsTable;
