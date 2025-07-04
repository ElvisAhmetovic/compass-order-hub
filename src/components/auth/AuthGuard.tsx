
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

const AuthGuard = ({ children, requiredRoles = [] }: AuthGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const sessionData = localStorage.getItem('userSession');
        if (!sessionData) {
          setUserSession(null);
          return;
        }
        
        const session = JSON.parse(sessionData);
        setUserSession(session);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUserSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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

  // Not authenticated
  if (!userSession) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if user has required role (if any required roles are specified)
  if (requiredRoles.length > 0 && !requiredRoles.includes(userSession.role)) {
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
          Your role: <span className="font-medium">{userSession.role}</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
