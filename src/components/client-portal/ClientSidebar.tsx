import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Package, FileText, HelpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/client/orders", icon: Package },
  { title: "Invoices", url: "/client/invoices", icon: FileText },
  { title: "Support", url: "/client/support", icon: HelpCircle },
  { title: "Profile", url: "/client/profile", icon: User },
];

const ClientSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  // Fetch unread support notifications count for client
  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadSupportCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .like('action_url', '/client/support/%');

      if (!error && count !== null) {
        setUnreadSupportCount(count);
      }
    };

    fetchUnreadSupportCount();

    // Real-time subscription for notifications changes
    const channel = supabase
      .channel(`client-support-notifications-sidebar-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUnreadSupportCount();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  return (
    <Sidebar
      className={cn(
        "border-r border-border transition-all duration-300",
        collapsed ? "w-14" : "w-60"
      )}
      collapsible="icon"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <span className="font-semibold text-lg text-foreground">Client Portal</span>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const showSupportBadge = item.url === "/client/support" && unreadSupportCount > 0;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors",
                          isActive(item.url)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {showSupportBadge && !collapsed && (
                          <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs">
                            {unreadSupportCount > 9 ? '9+' : unreadSupportCount}
                          </Badge>
                        )}
                        {showSupportBadge && collapsed && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ClientSidebar;
