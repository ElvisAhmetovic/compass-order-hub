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

  const isActive = (path: string) => location.pathname === path;

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
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                        isActive(item.url)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ClientSidebar;
