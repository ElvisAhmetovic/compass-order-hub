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
import { LayoutDashboard, Package, FileText, HelpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/ClientLanguageContext";

const navigationItems = [
  { titleKey: "nav.dashboard", url: "/client/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.orders", url: "/client/orders", icon: Package },
  { titleKey: "nav.invoices", url: "/client/invoices", icon: FileText },
  { titleKey: "nav.support", url: "/client/support", icon: HelpCircle },
  { titleKey: "nav.settings", url: "/client/settings", icon: Settings },
];

const ClientSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadSupportCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .like('action_url', '/client/support/%');

      if (error) {
        console.error("Error fetching client unread support count:", error);
        setUnreadSupportCount(0);
      } else {
        setUnreadSupportCount(count ?? 0);
      }
    };

    fetchUnreadSupportCount();

    const handleNotificationsChanged = () => fetchUnreadSupportCount();
    window.addEventListener("notifications:changed", handleNotificationsChanged);

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
      window.removeEventListener("notifications:changed", handleNotificationsChanged);
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
          <span className="font-semibold text-lg text-foreground">{t('nav.clientPortal')}</span>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            {t('nav.navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const title = t(item.titleKey);
                const showSupportBadge = item.url === "/client/support" && unreadSupportCount > 0;
                
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? title : undefined}
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
                          {!collapsed && <span>{title}</span>}
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
