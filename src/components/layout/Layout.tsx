
import { ReactNode } from "react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  userRole?: "admin" | "agent";
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header userRole={userRole} />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
