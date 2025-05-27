
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
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Define sidebar items with role restrictions
  const sidebarItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'agent', 'user'] },
    { href: '/support', icon: HelpCircle, label: 'Support', roles: ['admin', 'agent', 'user'] },
    { href: '/reviews', icon: Star, label: 'Reviews', roles: ['admin', 'agent', 'user'] },
    { href: '/companies', icon: Building2, label: 'Companies', roles: ['admin', 'agent'] },
    { href: '/proposals', icon: FileText, label: 'Proposals', roles: ['admin', 'agent'] },
    { href: '/invoices', icon: Receipt, label: 'Invoices', roles: ['admin', 'agent'] },
    { href: '/clients', icon: UserCheck, label: 'Clients', roles: ['admin', 'agent'] },
    { href: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'agent'] },
    { href: '/user-management', icon: Users, label: 'User Management', roles: ['admin'] }, // Admin only
    { href: '/deleted', icon: Trash2, label: 'Deleted', roles: ['admin'] }, // Admin only
  ];

  // Filter sidebar items based on user role
  const visibleItems = sidebarItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">Navigation</h2>
      </div>
      <nav className="mt-6">
        {visibleItems.map((item) => {
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
