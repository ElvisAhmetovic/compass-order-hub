
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user: localUser, isLoading: localLoading } = useAuth();
  const { user: supabaseUser, isLoading: supabaseLoading } = useSupabaseAuth();
  const location = useLocation();
  
  const isLoading = localLoading || supabaseLoading;
  const user = supabaseUser || localUser;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page but save the location they were trying to access
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
