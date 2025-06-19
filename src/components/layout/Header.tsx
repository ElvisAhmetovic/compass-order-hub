
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { LogoutButton } from "@/components/auth/LogoutButton";
import NotificationDropdown from "./NotificationDropdown";

interface HeaderProps {
  userRole?: string;
}

const Header = ({ userRole }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Order Management System
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && <NotificationDropdown />}
          <div className="text-sm text-gray-600">
            Welcome, {user?.email}
            {userRole && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {userRole}
              </span>
            )}
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
