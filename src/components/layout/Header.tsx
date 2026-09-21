import React from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";
import NotificationCenter from "@/components/notifications/NotificationCenter";

interface HeaderProps {
  userRole?: UserRole;
}

const Header = ({ userRole = "user" }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-card text-card-foreground shadow-soft-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-heading text-xl font-bold text-foreground">
              Order Management System
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            {user && (
              <div className="flex items-center space-x-3">
                <NotificationCenter />
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.full_name || user.email}
                </span>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
