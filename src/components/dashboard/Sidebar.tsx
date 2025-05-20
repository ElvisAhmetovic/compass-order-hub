
import { NavLink } from "react-router-dom";
import {
  Home,
  CircleCheck,
  XCircle,
  Receipt,
  CreditCard,
  Building2,
  Users,
  Trash,
  Star,
  LogOut,
  CheckCircle,
  XCircle2,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Home, label: "Active Orders", path: "/active-orders" },
  { icon: XCircle, label: "Complaints", path: "/complaints" },
  { icon: CheckCircle, label: "Completed", path: "/completed" },
  { icon: XCircle2, label: "Cancelled", path: "/cancelled" },
  { icon: Receipt, label: "Invoice Sent", path: "/invoice-sent" },
  { icon: CreditCard, label: "Invoice Paid", path: "/invoice-paid" },
  { icon: Building2, label: "Companies", path: "/companies" },
  { icon: Users, label: "User Management", path: "/user-management" },
  { icon: Trash, label: "Deleted", path: "/deleted" },
  { icon: Star, label: "Reviews", path: "/reviews" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        {/* Logout Button */}
        <div className="px-3 py-2 mt-4">
          <LogoutButton />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
