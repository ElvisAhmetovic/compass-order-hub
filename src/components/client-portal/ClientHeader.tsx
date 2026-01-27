import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";

const ClientHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="font-medium text-foreground">
          Welcome, {user?.full_name || user?.email}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DarkModeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default ClientHeader;
