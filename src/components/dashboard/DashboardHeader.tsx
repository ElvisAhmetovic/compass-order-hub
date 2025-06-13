import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  description: string;
  onCreateOrder?: () => void;
  createButtonText?: string;
}

const DashboardHeader = ({ 
  title, 
  description, 
  onCreateOrder,
  createButtonText = "Create Order"
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {onCreateOrder && (
        <Button onClick={onCreateOrder} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {createButtonText}
        </Button>
      )}
    </div>
  );
};

export default DashboardHeader;
