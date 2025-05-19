
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types";

interface LayoutProps {
  children: ReactNode;
  userRole?: UserRole;
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  // In a real application, this would check the user's permissions
  const hasAccess = () => {
    // For now, we'll allow access to all users
    // In a real application, you would check permissions based on the route
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
