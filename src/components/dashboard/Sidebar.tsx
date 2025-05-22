
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { UserRole } from "@/types";
import {
  LayoutDashboard,
  ListChecks,
  BadgeAlert,
  CheckCircle,
  XCircle,
  Receipt,
  CreditCard,
  Building2,
  Clock,
  Users2,
  Trash2,
  StarIcon,
  FileText,
  HelpCircle
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { user: localUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  
  // Combine auth sources, prioritizing Supabase user
  const user = supabaseUser || localUser;
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      showFor: ["admin", "owner", "user"],
    },
    {
      title: "Active Orders",
      href: "/active-orders",
      icon: Clock,
      showFor: ["admin", "owner", "user"],
    },
    {
      title: "Complaints",
      href: "/complaints",
      icon: BadgeAlert,
      showFor: ["admin", "owner", "user"],
    },
    {
      title: "Completed",
      href: "/completed",
      icon: CheckCircle,
      showFor: ["admin", "owner", "user"],
    },
    {
      title: "Invoice Sent",
      href: "/invoice-sent",
      icon: Receipt,
      showFor: ["admin", "owner"],
    },
    {
      title: "Invoice Paid",
      href: "/invoice-paid",
      icon: CreditCard,
      showFor: ["admin", "owner"],
    },
    {
      title: "Cancelled",
      href: "/cancelled",
      icon: XCircle,
      showFor: ["admin", "owner"],
    },
    {
      title: "Proposals",
      href: "/proposals",
      icon: FileText,
      showFor: ["admin", "owner"],
    },
    {
      title: "Companies",
      href: "/companies",
      icon: Building2,
      showFor: ["admin", "owner"],
    },
    {
      title: "User Management",
      href: "/user-management",
      icon: Users2,
      showFor: ["admin", "owner"],
    },
    {
      title: "Deleted",
      href: "/deleted",
      icon: Trash2,
      showFor: ["admin", "owner"],
    },
    {
      title: "Reviews",
      href: "/reviews",
      icon: StarIcon,
      showFor: ["admin", "owner", "user"],
    },
    {
      title: "Support",
      href: "/support",
      icon: HelpCircle,
      showFor: ["admin", "owner", "user"],
    },
  ];

  return (
    <div className="pb-12 min-h-screen w-64 bg-primary-foreground border-r flex flex-col">
      <div className="py-4 px-4 border-b">
        <h2 className="text-lg font-semibold">Order Flow Compass</h2>
      </div>
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {menuItems
            .filter(item => {
              // Handle permission check
              if (!user || !user.role) return false;
              return item.showFor.includes(user.role as UserRole);
            })
            .map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={index}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive ? "bg-secondary" : ""
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
