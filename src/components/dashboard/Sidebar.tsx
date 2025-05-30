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
  UserCheck,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Add debug logging
  console.log('Sidebar user:', user);
  console.log('User role:', user?.role);

  // Define sidebar items with role restrictions
  const menuItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'agent', 'user'] },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'agent'] },
    { href: '/support', icon: HelpCircle, label: 'Support', roles: ['admin', 'agent', 'user'] },
    { href: '/reviews', icon: Star, label: 'Reviews', roles: ['admin', 'agent', 'user'] },
    { href: '/active-orders', icon: FileText, label: 'My Orders', roles: ['user'] }, // User-specific orders view
    { href: '/companies', icon: Building2, label: 'Companies', roles: ['admin', 'agent'] },
    { href: '/proposals', icon: FileText, label: 'Proposals', roles: ['admin', 'agent'] },
    { href: '/invoices', icon: Receipt, label: 'Invoices', roles: ['admin', 'agent'] },
    { href: '/clients', icon: UserCheck, label: 'Clients', roles: ['admin', 'agent'] },
    { href: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'agent'] },
    { href: '/user-management', icon: Users, label: 'User Management', roles: ['admin'] }, // Admin only
    { href: '/deleted', icon: Trash2, label: 'Deleted', roles: ['admin'] }, // Admin only
    {
      title: "Team Chat",
      icon: MessageSquare,
      href: "/team-collaboration",
      requiresAuth: true,
      roles: ["admin", "agent", "user"]
    }
  ];

  // Filter sidebar items based on user role - make sure user and user.role exist
  const visibleItems = menuItems.filter(item => {
    if (!user || !user.role) {
      console.log('No user or role found');
      return false;
    }
    const hasAccess = item.roles.includes(user.role);
    console.log(`Item ${item.label} - User role: ${user.role} - Has access: ${hasAccess}`);
    return hasAccess;
  });

  console.log('Visible items:', visibleItems);

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">Navigation</h2>
      </div>
      <nav className="mt-6">
        {visibleItems.length === 0 ? (
          <div className="px-6 py-3 text-gray-500 text-sm">
            No menu items available
            <br />
            Role: {user?.role || 'No role'}
          </div>
        ) : (
          visibleItems.map((item) => {
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
                {item.label || item.title}
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
