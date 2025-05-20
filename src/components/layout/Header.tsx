
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userRole?: "admin" | "agent";
}

const Header = ({ userRole = "admin" }: HeaderProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, this would connect to Supabase auth
    localStorage.removeItem("userSession"); // Clear any session data
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate("/login");
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary">Order Flow Compass</h1>
          <Badge userRole={userRole} />
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">User</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {userRole === "admin" ? "Admin User" : "Agent User"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

// Badge component to show user role
const Badge = ({ userRole }: { userRole: string }) => {
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${
      userRole === "admin" 
        ? "bg-purple-100 text-purple-800" 
        : "bg-blue-100 text-blue-800"
    }`}>
      {userRole === "admin" ? "Admin" : "Agent"}
    </span>
  );
};

export default Header;
