
import React from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";

interface HeaderProps {
  userRole?: UserRole;
}

const Header = ({ userRole = "user" }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Order Management System
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
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
