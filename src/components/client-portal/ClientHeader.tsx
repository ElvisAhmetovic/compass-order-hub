import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ClientHeader = () => {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const initials = `${(user?.first_name || "")[0] || ""}${(user?.last_name || "")[0] || ""}`.toUpperCase() || "?";

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {/* Mobile hamburger menu */}
        <SidebarTrigger className="md:hidden" />
        <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
        <Avatar className="h-7 w-7 border border-border flex-shrink-0">
          <AvatarImage src={user?.avatar_url || undefined} alt="Profile" />
          <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
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
