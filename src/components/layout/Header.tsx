
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/types";

interface HeaderProps {
  userRole?: UserRole;
}

interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export default function Header({ userRole: defaultRole = "admin" }: HeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  
  useEffect(() => {
    try {
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        setUser(session);
      }
    } catch (error) {
      console.error('Error loading user session:', error);
    }
  }, []);
  
  const actualRole = user?.role || defaultRole;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* logo + role badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">Order Flow Compass</h1>
          <RoleBadge role={actualRole} />
        </div>

        {/* actions */}
        <div className="flex items-center gap-4">
          <LogoutButton />

          {/* user dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {user?.full_name || 'User'}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.email || (actualRole === "admin" ? "Admin User" : "Agent User")}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate("/login")}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/* small badge component */
function RoleBadge({ role }: { role: UserRole }) {
  const common = "px-2 py-0.5 text-xs rounded-full";
  const admin  = "bg-purple-100 text-purple-800";
  const agent  = "bg-blue-100 text-blue-800";
  const user   = "bg-green-100 text-green-800";

  let roleClass = admin;
  if (role === "agent") roleClass = agent;
  if (role === "user") roleClass = user;

  return <span className={`${common} ${roleClass}`}>{role}</span>;
}
