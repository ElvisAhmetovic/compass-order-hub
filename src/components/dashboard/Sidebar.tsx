import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Facebook,
  Instagram,
  UserX,
  Wrench,
  Trophy,
  BarChart2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [openSupportCount, setOpenSupportCount] = useState(0);

  const isAdmin = user?.role === 'admin';
  const isAdminOrAgent = user?.role === 'admin' || user?.role === 'agent';

  // Fetch open support inquiries count for admins/agents
  useEffect(() => {
    if (!isAdminOrAgent) return;

    const fetchOpenSupportCount = async () => {
      const { count, error } = await supabase
        .from('support_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      if (!error && count !== null) {
        setOpenSupportCount(count);
      }
    };

    fetchOpenSupportCount();

    // Real-time subscription for support inquiries changes
    const channel = supabase
      .channel('support-inquiries-sidebar')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_inquiries'
      }, () => {
        fetchOpenSupportCount();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAdminOrAgent]);

  // Define sidebar items with role restrictions
  const menuItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'agent', 'user'] },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'agent'] },
    { href: '/rankings', icon: Trophy, label: 'Rankings', roles: ['admin', 'agent'] },
    { href: '/user-statistics', icon: BarChart2, label: 'User Statistics', roles: ['admin', 'agent'] },
    { href: '/support', icon: HelpCircle, label: 'Support', roles: ['admin', 'agent', 'user'], showBadge: true },
    { href: '/tech-support', icon: Wrench, label: 'Tech Support', roles: ['admin', 'agent'] },
    { href: '/active-orders', icon: FileText, label: 'My Orders', roles: ['user'] },
    { href: '/active-orders', icon: Clock, label: 'Active Orders', roles: ['admin', 'agent'] },
    { href: '/yearly-packages', icon: Package, label: 'Yearly Packages', roles: ['admin', 'agent'] },
    { href: '/facebook', icon: Facebook, label: 'Facebook', roles: ['admin', 'agent'] },
    { href: '/instagram', icon: Instagram, label: 'Instagram', roles: ['admin', 'agent'] },
    { href: '/trustpilot', icon: Star, label: 'Trustpilot', roles: ['admin', 'agent'] },
    { href: '/trustpilot-deletion', icon: UserX, label: 'Trustpilot Deletion', roles: ['admin', 'agent'] },
    { href: '/google-deletion', icon: UserX, label: 'Google Deletion', roles: ['admin', 'agent'] },
    { href: '/complaints', icon: AlertTriangle, label: 'Complaints', roles: ['admin', 'agent'] },
    { href: '/completed', icon: CheckCircle, label: 'Completed', roles: ['admin', 'agent'] },
    { href: '/cancelled', icon: XCircle, label: 'Cancelled', roles: ['admin', 'agent'] },
    { href: '/reviews', icon: Eye, label: 'Reviews', roles: ['admin', 'agent', 'user'] },
    { href: '/invoice-sent', icon: Receipt, label: 'Invoice Sent', roles: ['admin', 'agent'] },
    { href: '/invoice-paid', icon: Receipt, label: 'Invoice Paid', roles: ['admin', 'agent'] },
    { href: '/companies', icon: Building2, label: 'Companies', roles: ['admin', 'agent'] },
    { href: '/proposals', icon: FileText, label: 'Proposals', roles: ['admin', 'agent'] },
    { href: '/invoices', icon: Receipt, label: 'Invoices', roles: ['admin', 'agent'] },
    { href: '/clients', icon: UserCheck, label: 'Clients', roles: ['admin', 'agent'] },
    { href: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'agent'] },
    { href: '/user-management', icon: Users, label: 'User Management', roles: ['admin'] },
    { href: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
    { href: '/deleted', icon: Trash2, label: 'Deleted', roles: ['admin'] },
    {
      href: "/team-collaboration",
      icon: MessageSquare,
      label: "Team Chat",
      roles: ["admin", "agent", "user"]
    }
  ];

  // Filter sidebar items based on user role
  const visibleItems = menuItems.filter(item => {
    if (!user || !user.role) {
      return false;
    }
    return item.roles.includes(user.role);
  });

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
              (item.href !== '/dashboard' && item.href !== '/active-orders' && location.pathname.startsWith(item.href)) ||
              (item.href === '/active-orders' && location.pathname.startsWith('/active-orders'));
            
            const showSupportBadge = item.showBadge && isAdminOrAgent && openSupportCount > 0;
            
            return (
              <Link
                key={`${item.href}-${item.label}`}
                to={item.href}
                className={cn(
                  "flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors",
                  isActive && "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                )}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </div>
                {showSupportBadge && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs">
                    {openSupportCount > 99 ? '99+' : openSupportCount}
                  </Badge>
                )}
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
