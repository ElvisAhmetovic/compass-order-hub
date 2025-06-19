
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
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Add debug logging
  console.log('Sidebar user:', user);
  console.log('User role:', user?.role);

  // Define sidebar items with role restrictions
  const menuItems = [
    { href: '/dashboard', icon: Home, label: t('dashboard'), roles: ['admin', 'agent', 'user'] },
    { href: '/analytics', icon: BarChart3, label: t('analytics'), roles: ['admin', 'agent'] },
    { href: '/support', icon: HelpCircle, label: t('support'), roles: ['admin', 'agent', 'user'] },
    { href: '/active-orders', icon: FileText, label: t('myOrders'), roles: ['user'] }, // User-specific orders view
    { href: '/active-orders', icon: Clock, label: t('activeOrders'), roles: ['admin', 'agent'] }, // Admin/agent view
    { href: '/yearly-packages', icon: Package, label: t('yearlyPackages'), roles: ['admin', 'agent'] }, // New yearly packages section
    { href: '/complaints', icon: AlertTriangle, label: t('complaints'), roles: ['admin', 'agent'] },
    { href: '/completed', icon: CheckCircle, label: t('completed'), roles: ['admin', 'agent'] },
    { href: '/cancelled', icon: XCircle, label: t('cancelled'), roles: ['admin', 'agent'] },
    { href: '/reviews', icon: Eye, label: t('reviews'), roles: ['admin', 'agent', 'user'] },
    { href: '/invoice-sent', icon: Receipt, label: t('invoiceSent'), roles: ['admin', 'agent'] },
    { href: '/invoice-paid', icon: Receipt, label: t('invoicePaid'), roles: ['admin', 'agent'] },
    { href: '/companies', icon: Building2, label: t('companies'), roles: ['admin', 'agent'] },
    { href: '/proposals', icon: FileText, label: t('proposals'), roles: ['admin', 'agent'] },
    { href: '/invoices', icon: Receipt, label: t('invoices'), roles: ['admin', 'agent'] },
    { href: '/clients', icon: UserCheck, label: t('clients'), roles: ['admin', 'agent'] },
    { href: '/inventory', icon: Package, label: t('inventory'), roles: ['admin', 'agent'] },
    { href: '/user-management', icon: Users, label: t('userManagement'), roles: ['admin'] }, // Admin only
    { href: '/deleted', icon: Trash2, label: t('deleted'), roles: ['admin'] }, // Admin only
    {
      href: "/team-collaboration",
      icon: MessageSquare,
      label: t('teamChat'),
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
        <h2 className="text-xl font-semibold text-gray-800">{t('navigation')}</h2>
      </div>
      <nav className="mt-6">
        {visibleItems.length === 0 ? (
          <div className="px-6 py-3 text-gray-500 text-sm">
            {t('noDataFound')}
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
                key={`${item.href}-${item.label}`}
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
          })
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
