
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Proposal, ProposalStatus } from '@/types/proposal';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProposalRowProps {
  proposal: Proposal;
  onStatusChange: (id: string, newStatus: string) => void;
}

const ProposalRow: React.FC<ProposalRowProps> = ({ proposal, onStatusChange }) => {
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    const statusColors = {
      'Unpaid': 'bg-yellow-500 text-white',
      'unpaid': 'bg-yellow-500 text-white',
      'Paid': 'bg-green-500 text-white',
      'paid': 'bg-green-500 text-white',
      'Received': 'bg-blue-500 text-white',
      'received': 'bg-blue-500 text-white',
      'Calculated': 'bg-green-500 text-white',
      'calculated': 'bg-green-500 text-white',
      'Partially Calculated': 'bg-teal-500 text-white',
      'partially calculated': 'bg-teal-500 text-white',
      'Rejected': 'bg-red-500 text-white',
      'rejected': 'bg-red-500 text-white',
      'Draft': 'bg-gray-500 text-white',
      'draft': 'bg-gray-500 text-white',
      'Archived': 'bg-gray-700 text-white',
      'archived': 'bg-gray-700 text-white',
    };
    return statusColors[status] || 'bg-gray-500 text-white';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log(`Updating status for proposal ${proposal.id} to ${newStatus}`);
      
      // Update in Supabase first
      const { error } = await supabase
        .from('proposals')
        .update({ status: newStatus.toLowerCase() })
        .eq('id', proposal.id);
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Supabase update successful");
      
      // Then update UI via callback
      onStatusChange(proposal.id, newStatus.toLowerCase());
      
      toast({
        title: "Status Updated",
        description: `Proposal status changed to ${newStatus}`,
      });
    } catch (err) {
      console.error("Error updating proposal status:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update proposal status. Please try again.",
      });
    }
  };

  const handleExportPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Export Started",
      description: `Generating PDF for proposal ${proposal.reference}`,
    });
    // In a real app, implement PDF export
  };

  const availableStatuses = [
    'Draft', 'Unpaid', 'Paid', 'Received', 'Calculated', 'Partially Calculated', 'Rejected', 'Archived'
  ];

  // Normalize the display status (capitalize first letter)
  const displayStatus = proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1).toLowerCase();

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer">
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 p-0">
              <Badge className={getStatusColor(proposal.status)}>{displayStatus}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-50 bg-background">
            {availableStatuses.map(status => (
              <DropdownMenuItem 
                key={status} 
                onClick={() => handleStatusChange(status)}
              >
                <Badge className={`${getStatusColor(status)} mr-2`}>{status}</Badge>
                Set as {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <TableCell>{proposal.number}</TableCell>
      <TableCell>
        <div className="font-medium">{proposal.customer}</div>
        <div className="text-sm text-muted-foreground">Proposal {proposal.reference}</div>
      </TableCell>
      <TableCell>{formatDate(proposal.created_at)}</TableCell>
      <TableCell className="text-right font-medium">{proposal.amount}</TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={handleExportPDF}>
          <Download className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default ProposalRow;
