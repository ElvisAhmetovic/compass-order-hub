
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  userRole?: UserRole;
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  const location = useLocation();
  
  // Check if user has access to this route based on their role
  const hasAccess = () => {
    const path = location.pathname;
    
    // Admin can access everything
    if (userRole === "admin") return true;
    
    // Agents can't access user management
    if (userRole === "agent" && path.includes("/user-management")) return false;
    
    // Regular users have limited access
    if (userRole === "user") {
      // Users can only access dashboard, active orders, completed and reviews
      const allowedPaths = [
        "/dashboard", 
        "/active-orders", 
        "/completed", 
        "/reviews"
      ];
      return allowedPaths.some(allowedPath => path.includes(allowedPath));
    }
    
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-6 py-6">
        {hasAccess() ? (
          children
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground mt-2">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
