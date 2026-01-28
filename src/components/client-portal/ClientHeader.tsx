import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const ClientHeader = () => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {/* Mobile hamburger menu */}
        <SidebarTrigger className="md:hidden" />
        <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
        <span className="font-medium text-foreground text-sm md:text-base truncate">
          {isMobile ? (user?.first_name || "Welcome") : `Welcome, ${user?.full_name || user?.email}`}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <NotificationCenter />
        <DarkModeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default ClientHeader;
