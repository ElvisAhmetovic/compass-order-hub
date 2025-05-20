
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  onCreateOrder?: () => void;
}

const DashboardHeader = ({ 
  title, 
  description,
  onCreateOrder
}: DashboardHeaderProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      
      {isAdmin && onCreateOrder && (
        <Button 
          onClick={onCreateOrder}
          className="flex items-center gap-1 ml-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Order</span>
        </Button>
      )}
      
      {!isAdmin && title.toLowerCase().includes('order') && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm text-amber-800 flex items-center gap-2 ml-auto">
          <p>Only administrators can create new orders</p>
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
