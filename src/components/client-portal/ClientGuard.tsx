import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ClientGuardProps {
  children: ReactNode;
}

const ClientGuard = ({ children }: ClientGuardProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/client/login" state={{ from: location }} replace />;
  }

  if (user.role !== "client") {
    // If user is admin/agent/user, redirect them to admin dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ClientGuard;
