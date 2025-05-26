import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Users, 
  Package, 
  Trash2, 
  Star, 
  HelpCircle,
  FileText,
  Receipt,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/proposals', icon: FileText, label: 'Proposals' },
  { href: '/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/clients', icon: UserCheck, label: 'Clients' },
  { href: '/user-management', icon: Users, label: 'User Management' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/deleted', icon: Trash2, label: 'Deleted' },
  { href: '/reviews', icon: Star, label: 'Reviews' },
  { href: '/support', icon: HelpCircle, label: 'Support' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">Navigation</h2>
      </div>
      <nav className="mt-6">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors",
                isActive && "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
