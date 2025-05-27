
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="mb-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-lg text-muted-foreground mb-2">
            You don't have permission to access this area.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            This section is restricted to administrators only.
          </p>
        </div>
        
        <Button 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="text-xs text-muted-foreground bg-gray-100 px-3 py-2 rounded">
          Current role: <span className="font-medium">{user?.role || 'Not authenticated'}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
