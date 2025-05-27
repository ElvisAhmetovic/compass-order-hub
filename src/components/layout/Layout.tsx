
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  userRole?: UserRole;
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if user has access to this route based on their role
  const hasAccess = () => {
    const path = location.pathname;
    
    // Admin can access everything
    if (userRole === "admin") return true;
    
    // Agents can't access user management
    if (userRole === "agent" && path.includes("/user-management")) return false;
    
    // Regular users have limited access
    if (userRole === "user") {
      // Users can access dashboard, active orders, completed, reviews and support
      const allowedPaths = [
        "/dashboard", 
        "/active-orders", 
        "/completed", 
        "/reviews",
        "/support"
      ];
      return allowedPaths.some(allowedPath => path.includes(allowedPath));
    }
    
    return true;
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header userRole={userRole} />
      <main className="flex-1 px-6 py-6">
        {hasAccess() ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground mt-2 mb-6">
                You don't have permission to access this page.
              </p>
              <Button 
                onClick={handleBackToDashboard} 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
