import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UsersRound,
  Boxes,
  Trash2,
  Star,
  LifeBuoy,
  HandCoins,
  FileSignature,
  Receipt,
  ReceiptEuro,
  ReceiptText,
  Contact,
  ChartNoAxesColumn,
  ChartPie,
  MessageSquare,
  TriangleAlert,
  CircleCheckBig,
  CircleX,
  ListChecks,
  ClipboardList,
  FileSearch,
  CalendarClock,
  CalendarRange,
  CalendarDays,
  Instagram,
  UserRoundX,
  Wrench,
  Trophy,
  Settings2,
  TicketCheck,
  Clock,
  BellRing,
  ChevronDown,
  MoreHorizontal,
  Lock,
  Facebook as FacebookIcon,
  Globe,
  Music2,
  Twitter as TwitterIcon,
  Share2
} from 'lucide-react';
import { isSuperAdminEmail, fetchLateCountToday } from '@/services/workHoursV2Service';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSidebarConfig } from '@/hooks/useSidebarConfig';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [lateWhCount, setLateWhCount] = useState(0);
  const isSuper = isSuperAdminEmail((user as any)?.email);

  const isAdmin = user?.role === 'admin';
  const isAdminOrAgent = user?.role === 'admin' || user?.role === 'agent';

  // Live clock for Sarajevo time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Fetch open customer tickets count
  useEffect(() => {
    if (!isAdminOrAgent) return;

    const fetchOpenTickets = async () => {
      const { count, error } = await supabase
        .from('customer_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      if (!error) setOpenTicketCount(count ?? 0);
    };

    fetchOpenTickets();

    const ticketChannel = supabase
      .channel('customer-tickets-sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_tickets' }, () => {
        fetchOpenTickets();
      })
      .subscribe();

    return () => {
      ticketChannel.unsubscribe();
    };
  }, [isAdminOrAgent]);

  // Late work-hours submissions count for super admin
  useEffect(() => {
    if (!isSuper) return;
    let cancelled = false;
    const tick = () => fetchLateCountToday().then(c => { if (!cancelled) setLateWhCount(c); }).catch(() => {});
    tick();
    const interval = setInterval(tick, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isSuper]);

  // Define sidebar items with role restrictions
  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'agent', 'user'] },
    { href: '/work-hours', icon: Clock, label: 'Work Hours', roles: ['admin', 'agent'] },
    { href: '/admin/work-hours', icon: CalendarClock, label: 'Work Hours Admin', roles: ['admin', 'agent', 'user'], superAdminOnly: true, showWhAdminBadge: true },
    { href: '/monthly-packages', icon: CalendarRange, label: 'Monthly Packages', roles: ['admin', 'agent'] },
    { href: '/monthly-invoice-status', icon: ClipboardList, label: 'Invoice Status', roles: ['admin', 'agent'] },
    { href: '/reminders', icon: BellRing, label: 'Reminders', roles: ['admin', 'agent'] },
    { href: '/user-management', icon: UsersRound, label: 'User Management', roles: ['admin'] },
    { href: '/support', icon: LifeBuoy, label: 'Support', roles: ['admin', 'agent', 'user'], showBadge: true },
    { href: '/customer-tickets', icon: TicketCheck, label: 'Customer Tickets', roles: ['admin', 'agent'], showTicketBadge: true },
    { href: '/tech-support', icon: Wrench, label: 'Tech Support', roles: ['admin', 'agent'] },
    { href: '/active-orders', icon: ListChecks, label: 'My Orders', roles: ['user'] },
    { href: '/active-orders', icon: ListChecks, label: 'Active Orders', roles: ['admin', 'agent'] },
    { href: '/invoice-sent', icon: ReceiptText, label: 'Invoice Sent', roles: ['admin', 'agent'] },
    { href: '/invoice-paid', icon: ReceiptEuro, label: 'Invoice Paid', roles: ['admin', 'agent'] },
    { href: '/invoices', icon: Receipt, label: 'Invoices', roles: ['admin', 'agent'] },
    { href: '/admin/invoice-audit', icon: FileSearch, label: 'Invoice Audit Log', roles: ['admin', 'agent', 'user'], superAdminOnly: true },
    { href: '/proposals', icon: FileSignature, label: 'Proposals', roles: ['admin', 'agent'] },
    { href: '/offers', icon: HandCoins, label: 'Offers', roles: ['admin', 'agent'] },
    
    { href: '/google-deletion', icon: UserRoundX, label: 'Google Deletion', roles: ['admin', 'agent'] },
    { href: '/complaints', icon: TriangleAlert, label: 'Complaints', roles: ['admin', 'agent'] },
    { href: '/completed', icon: CircleCheckBig, label: 'Completed', roles: ['admin', 'agent'] },
    { href: '/cancelled', icon: CircleX, label: 'Cancelled', roles: ['admin', 'agent'] },
    { href: '/reviews', icon: Star, label: 'Reviews', roles: ['admin', 'agent', 'user'] },
    { href: '/companies', icon: Building2, label: 'Companies', roles: ['admin', 'agent'] },
    { href: '/clients', icon: Contact, label: 'Clients', roles: ['admin', 'agent'] },
    { href: '/inventory', icon: Boxes, label: 'Inventory', roles: ['admin', 'agent'] },
    { href: '/rankings', icon: Trophy, label: 'Rankings', roles: ['admin', 'agent'] },
    { href: '/analytics', icon: ChartNoAxesColumn, label: 'Analytics', roles: ['admin', 'agent'] },
    { href: '/user-statistics', icon: ChartPie, label: 'User Statistics', roles: ['admin', 'agent'] },
    { href: '/settings', icon: Settings2, label: 'Settings', roles: ['admin'] },
    { href: '/deleted', icon: Trash2, label: 'Deleted', roles: ['admin'] },
    { href: '/yearly-packages', icon: CalendarDays, label: 'Yearly Packages', roles: ['admin', 'agent'] },
    {
      href: "/team-collaboration",
      icon: MessageSquare,
      label: "Team Chat",
      roles: ["admin", "agent", "user"]
    }
  ];

  const { isHidden } = useSidebarConfig();

  // Filter sidebar items based on user role
  const roleFilteredItems = menuItems.filter(item => {
    if (!user || !user.role) return false;
    return item.roles.includes(user.role);
  });

  // Split into main and "more" items
  const mainItems = roleFilteredItems.filter(item => !isHidden(item.label));
  const moreItems = roleFilteredItems.filter(item => isHidden(item.label));

  // Auto-expand "More..." if active route is inside it
  const [moreOpen, setMoreOpen] = useState(false);
  const activeInMore = moreItems.some(item => 
    location.pathname === item.href || 
    (item.href !== '/dashboard' && item.href !== '/active-orders' && location.pathname.startsWith(item.href)) ||
    (item.href === '/active-orders' && location.pathname.startsWith('/active-orders'))
  );

  // Social Media group
  const socialItems = [
    { href: '/social/facebook', icon: FacebookIcon, label: 'Facebook' },
    { href: '/social/abm-website', icon: Globe, label: 'ABM Website' },
    { href: '/social/instagram', icon: Instagram, label: 'Instagram' },
    { href: '/social/tiktok', icon: Music2, label: 'TikTok' },
    { href: '/social/twitter', icon: TwitterIcon, label: 'Twitter (X)' },
  ];
  const socialActive = socialItems.some(i => location.pathname.startsWith(i.href));
  const [socialOpen, setSocialOpen] = useState(false);
  useEffect(() => { if (socialActive) setSocialOpen(true); }, [socialActive]);
  const showSocialGroup = isAdminOrAgent;

  useEffect(() => {
    if (activeInMore) setMoreOpen(true);
  }, [activeInMore]);

  const renderItem = (item: typeof menuItems[0]) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href || 
      (item.href !== '/dashboard' && item.href !== '/active-orders' && location.pathname.startsWith(item.href)) ||
      (item.href === '/active-orders' && location.pathname.startsWith('/active-orders'));
    
    const showSupportBadge = item.showBadge && isAdminOrAgent && unreadSupportCount > 0;
    const showTicketBadge = (item as any).showTicketBadge && isAdminOrAgent && openTicketCount > 0;
    const showWhAdminBadge = (item as any).showWhAdminBadge && isSuper && lateWhCount > 0;
    const isLocked = (item as any).superAdminOnly && !isSuper;

    if (isLocked) {
      return (
        <div
          key={`${item.href}-${item.label}`}
          title="Restricted to authorized admins"
          aria-disabled="true"
          className="flex items-center justify-between px-6 py-3 text-sidebar-foreground/40 cursor-not-allowed select-none"
        >
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-3" strokeWidth={1.75} />
            {item.label}
          </div>
          <Lock className="w-4 h-4" />
        </div>
      );
    }

    return (
      <Link
        key={`${item.href}-${item.label}`}
        to={item.href}
        className={cn(
          "flex items-center justify-between px-6 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
          isActive && "bg-sidebar-accent text-sidebar-foreground border-r-2 border-sidebar-primary"
        )}
      >
        <div className="flex items-center">
          <Icon
            className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")}
            strokeWidth={1.75}
          />
          <span className="relative inline-block">
            {item.label}
            <span
              className={cn(
                "absolute left-0 -bottom-1 h-0.5 rounded-full bg-sidebar-primary transition-all duration-200",
                isActive ? "w-full opacity-100" : "w-0 opacity-0"
              )}
              aria-hidden="true"
            />
          </span>
        </div>
        {showSupportBadge && (
          <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs">
            {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
          </Badge>
        )}
        {showTicketBadge && (
          <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs">
            {openTicketCount > 99 ? '99+' : openTicketCount}
          </Badge>
        )}
        {showWhAdminBadge && (
          <Badge
            variant="destructive"
            title={`${lateWhCount} late submission${lateWhCount === 1 ? '' : 's'} today`}
            className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs animate-pulse"
          >
            {lateWhCount > 99 ? '99+' : lateWhCount}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen">
      <div className="p-6">
        <a
          href="https://www.abm-team.com/en"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xl font-bold font-heading text-sidebar-foreground hover:text-sidebar-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded transition-colors"
        >
          AB Media Team CRM
        </a>
        <div className="mt-2 text-sidebar-foreground/60">
          <div className="font-mono text-lg font-semibold text-sidebar-foreground">
            {currentTime.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin' })}
          </div>
          <div className="text-xs">
            {currentTime.toLocaleDateString('en-US', { timeZone: 'Europe/Berlin', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            {' · '}Duisburg, Germany
          </div>
        </div>
      </div>
      <nav className="mt-6">
        {roleFilteredItems.length === 0 ? (
          <div className="px-6 py-3 text-sidebar-foreground/60 text-sm">
            No menu items available
            <br />
            Role: {user?.role || 'No role'}
          </div>
        ) : (
          <>
            {mainItems.map(renderItem)}

            {showSocialGroup && (
              <div className="border-t border-sidebar-border mt-2">
                <button
                  onClick={() => setSocialOpen(!socialOpen)}
                  className={cn(
                    "flex items-center justify-between w-full px-6 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
                    socialActive && "text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <Share2 className="w-5 h-5 mr-3" />
                    Social Media
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", socialOpen && "rotate-180")} />
                </button>
                {socialOpen && (
                  <div className="bg-sidebar-accent/40">
                    {socialItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center px-10 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
                            isActive && "bg-sidebar-accent text-sidebar-foreground border-r-2 border-sidebar-primary"
                          )}
                        >
                          <Icon
                            className={cn("w-4 h-4 mr-3 transition-colors", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")}
                            strokeWidth={1.75}
                          />
                          <span className="relative inline-block">
                            {item.label}
                            <span
                              className={cn(
                                "absolute left-0 -bottom-1 h-0.5 rounded-full bg-sidebar-primary transition-all duration-200",
                                isActive ? "w-full opacity-100" : "w-0 opacity-0"
                              )}
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {moreItems.length > 0 && (
              <div className="border-t border-sidebar-border mt-2">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center justify-between w-full px-6 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <div className="flex items-center">
                    <MoreHorizontal className="w-5 h-5 mr-3" />
                    More...
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", moreOpen && "rotate-180")} />
                </button>
                {moreOpen && (
                  <div className="bg-sidebar-accent/40">
                    {moreItems.map(renderItem)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
