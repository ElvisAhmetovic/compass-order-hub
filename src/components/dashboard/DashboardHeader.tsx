
import { Button } from "@/components/ui/button";
import { RefreshCcw, Plus } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  description: string;
  onCreateOrder: () => void;
}

const DashboardHeader = ({ title, description, onCreateOrder }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon">
          <RefreshCcw className="h-4 w-4" />
        </Button>
        <Button onClick={onCreateOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
