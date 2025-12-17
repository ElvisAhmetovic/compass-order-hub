
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
    <div className="flex-1 min-w-0 min-h-screen bg-gray-50 dark:bg-gray-900">
      <GlobalNotifications />
      <Header userRole={userRole} />
      <main className="px-4 py-8 max-w-full">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
