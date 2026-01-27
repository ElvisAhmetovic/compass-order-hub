import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user is a client trying to access admin routes, redirect to client dashboard
  if (user.role === 'client') {
    const clientRoutes = ['/client'];
    const isClientRoute = clientRoutes.some(route => location.pathname.startsWith(route));
    
    if (!isClientRoute) {
      console.log('Client user attempting to access admin route, redirecting to client dashboard');
      return <Navigate to="/client/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
