import { ReactNode } from "react";
import ClientSidebar from "./ClientSidebar";
import ClientHeader from "./ClientHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
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
