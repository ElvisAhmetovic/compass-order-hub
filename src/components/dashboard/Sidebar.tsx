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
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import CreateOrderModal from '@/components/dashboard/CreateOrderModal';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isAdminOrAgent = user?.role === 'admin' || user?.role === 'agent';

  // Fetch unread support notifications count for admins/agents
  useEffect(() => {
    if (!isAdminOrAgent || !user?.id) return;

    const fetchUnreadSupportCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .like('action_url', '/support/%');

      if (error) {
        console.error("Error fetching unread support count:", error);
        setUnreadSupportCount(0);
      } else {
        setUnreadSupportCount(count ?? 0);
      }
    };

    fetchUnreadSupportCount();

    // Fallback: listen for manual "notifications changed" events
    const handleNotificationsChanged = () => fetchUnreadSupportCount();
    window.addEventListener("notifications:changed", handleNotificationsChanged);

    // Real-time subscription for notifications changes
    const channel = supabase
      .channel(`support-notifications-sidebar-${user.id}`)
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
  }, [isAdminOrAgent, user?.id]);

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
    <div className="w-64 bg-background border-r border-border min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-foreground">Navigation</h2>
        {isAdmin && (
          <Button onClick={() => setCreateModalOpen(true)} className="w-full mt-3 justify-start" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Create Order
          </Button>
        )}
      </div>
      <nav className="mt-2">
        {visibleItems.length === 0 ? (
          <div className="px-6 py-3 text-muted-foreground text-sm">
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
            
            const showSupportBadge = item.showBadge && isAdminOrAgent && unreadSupportCount > 0;
            
            return (
              <Link
                key={`${item.href}-${item.label}`}
                to={item.href}
                className={cn(
                  "flex items-center justify-between px-6 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive && "bg-primary/10 text-primary border-r-2 border-primary"
                )}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </div>
                {showSupportBadge && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs">
                    {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
                  </Badge>
                )}
              </Link>
            );
          })
        )}
      </nav>
      <CreateOrderModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
