import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logPortalActivity } from "@/services/portalActivity";

import ClientSidebar from "./ClientSidebar";
import ClientHeader from "./ClientHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const { pathname } = useLocation();
  useEffect(() => { logPortalActivity("page_view", { page: pathname.replace(/[0-9a-f-]{36}/g, ":id") }); }, [pathname]);
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ClientSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <ClientHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ClientLayout;
