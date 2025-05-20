
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <div className="flex flex-col gap-4">
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
      </div>
      
      {!isAdmin && title.toLowerCase().includes('order') && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription className="text-amber-800">
            You can only see orders assigned to you. Contact an administrator if you need access to additional orders.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DashboardHeader;
