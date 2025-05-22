
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProposalsHeaderProps {
  title: string;
  onCreateProposal: () => void;
}

const ProposalsHeader: React.FC<ProposalsHeaderProps> = ({ title, onCreateProposal }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          Upravljajte svojim prijedlozima i pratite njihov status
        </p>
      </div>
      <Button onClick={onCreateProposal} className="gap-1">
        <Plus className="h-4 w-4" /> Dodavanje prijedloga
      </Button>
    </div>
  );
};

export default ProposalsHeader;
