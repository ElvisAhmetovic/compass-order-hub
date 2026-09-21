
import Header from "./Header";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types";
import GlobalNotifications from "./GlobalNotifications";
import WorkBreakBanner from "@/components/work-hours/WorkBreakBanner";

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  return (
    <div className="flex-1 min-w-0 bg-background text-foreground">
      <GlobalNotifications />
      <WorkBreakBanner />
      <Header userRole={userRole} />
      <main className="px-4 py-8 max-w-full">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
