import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { isTeamRole } from './teamAccess';
import { LogoutButton } from './LogoutButton';

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
    const isClientRoute = clientRoutes.some(route => location.pathname === route || location.pathname.startsWith(`${route}/`));
    
    if (!isClientRoute) {
      console.log('Client user attempting to access admin route, redirecting to client dashboard');
      return <Navigate to="/client/dashboard" replace />;
    }
  }

  if (user.role !== 'client' && !isTeamRole(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Your account is waiting for access</h1>
        <p className="max-w-md text-muted-foreground">The Empria team has not given this account access yet. If you work with us, ask an admin to set up your access.</p>
        <LogoutButton />
      </div>
    );
  }

  return <>{children}</>;
};
