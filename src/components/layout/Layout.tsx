
import Header from "./Header";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types";
import GlobalNotifications from "./GlobalNotifications";

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNotifications />
      <Header userRole={userRole} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
