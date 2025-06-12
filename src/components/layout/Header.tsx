
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UserRole } from "@/types";
import NotificationCenter from "@/components/notifications/NotificationCenter";

interface HeaderProps {
  userRole?: UserRole;
}

const Header = ({ userRole = "admin" }: HeaderProps) => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/2d4259f4-7fb1-4221-9e23-4bec4378d055.png" 
            alt="AB Media Team Logo" 
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-semibold">Order Management System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
