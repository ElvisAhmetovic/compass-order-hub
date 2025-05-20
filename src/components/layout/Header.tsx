
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

type UserRole = "admin" | "agent";

interface HeaderProps {
  userRole?: UserRole;          // optional; defaults to "admin"
}

export default function Header({ userRole = "admin" }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* logo + role badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">Order Flow Compass</h1>
          <RoleBadge role={userRole} />
        </div>

        {/* actions */}
        <div className="flex items-center gap-4">
          <LogoutButton />

          {/* user dropdown */}
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

  return <span className={`${common} ${role === "admin" ? admin : agent}`}>{role}</span>;
}
