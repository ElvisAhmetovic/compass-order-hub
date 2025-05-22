
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Proposal } from '@/types/proposal';
import { format } from 'date-fns';

interface ProposalRowProps {
  proposal: Proposal;
}

const ProposalRow: React.FC<ProposalRowProps> = ({ proposal }) => {
  const getStatusColor = (status: string) => {
    const statusColors = {
      'Neisplaćen': 'bg-yellow-500 text-white',
      'Primljen': 'bg-blue-500 text-white',
      'Izračunat': 'bg-green-500 text-white',
      'Djelomično izračunato': 'bg-teal-500 text-white',
      'Odbijen': 'bg-red-500 text-white',
      'Nacrt': 'bg-gray-500 text-white',
      'Arhiv': 'bg-gray-700 text-white',
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

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer">
      <TableCell>
        <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
      </TableCell>
      <TableCell>{proposal.number}</TableCell>
      <TableCell>
        <div className="font-medium">{proposal.customer}</div>
        <div className="text-sm text-muted-foreground">Prijedlog {proposal.reference}</div>
      </TableCell>
      <TableCell>{formatDate(proposal.created_at)}</TableCell>
      <TableCell className="text-right font-medium">{proposal.amount}</TableCell>
    </TableRow>
  );
};

export default ProposalRow;
