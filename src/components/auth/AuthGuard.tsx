import { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

const AuthGuard = ({ children, requiredRoles = [] }: AuthGuardProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated - use Supabase session, not localStorage
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if user has required role (role comes from profiles table via AuthContext)
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page.
        </p>
        <Button 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <p className="text-sm">
          Your role: <span className="font-medium">{user.role}</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
