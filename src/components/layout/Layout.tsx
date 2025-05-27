
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  userRole?: UserRole;
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header userRole={userRole} />
      <main className="flex-1 px-6 py-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
