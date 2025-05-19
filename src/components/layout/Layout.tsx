
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  userRole?: "admin" | "agent";
}

const Layout = ({ children, userRole = "admin" }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-6 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
