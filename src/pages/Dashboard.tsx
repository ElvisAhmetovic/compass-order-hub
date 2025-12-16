import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import OrderTable from "@/components/dashboard/OrderTable";
import OrderModal from "@/components/dashboard/OrderModal";
import CreateOrderModal from "@/components/dashboard/CreateOrderModal";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { PaymentReminderCard } from "@/components/dashboard/PaymentReminderCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Order, UserRole, OrderStatus } from "@/types";
import ActiveOrdersTabs from "@/components/dashboard/ActiveOrdersTabs";
import Sidebar from "@/components/dashboard/Sidebar";
import { useLocation, useSearchParams } from "react-router-dom";
import { useOrderModal } from "@/hooks/useOrderModal";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MigrationService } from "@/services/migrationService";
import { toast } from "@/hooks/use-toast";
import TeamEncouragement from "@/components/dashboard/TeamEncouragement";
import TemporaryNotificationBanner from "@/components/notifications/TemporaryNotificationBanner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showMigrationButton, setShowMigrationButton] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const [searchParams] = useSearchParams();
  
  // Use the order modal hook
  const { currentOrder, isOpen, open, close } = useOrderModal();
  
  // Get user role from auth context
  const { user } = useAuth();
  const userRole: UserRole = user?.role || "user";
  const isAdmin = userRole === "admin";

  // Handle orderId from URL query parameter (for email links)
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && user) {
      const fetchAndOpenOrder = async () => {
        try {
          const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (error) throw error;

          if (order) {
            open(order as Order);
          } else {
            toast({
              title: "Order Not Found",
              description: "The order you're looking for doesn't exist.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error fetching order:', error);
          toast({
            title: "Error",
            description: "Failed to load the order. Please try again.",
            variant: "destructive"
          });
        }
      };

      fetchAndOpenOrder();
    }
  }, [searchParams, user, open]);

  // Check if there's localStorage data to migrate
  useEffect(() => {
    const checkForLocalStorageData = async () => {
      if (!isAdmin) return;
      
      const storedOrders = localStorage.getItem("orders");
      const storedCompanies = localStorage.getItem("companies");
      
      // Only show migration if there's actual data and user is authenticated
      if (user && (
        (storedOrders && JSON.parse(storedOrders).length > 0) ||
        (storedCompanies && JSON.parse(storedCompanies).length > 0)
      )) {
        setShowMigrationButton(true);
      }
    };
    
    checkForLocalStorageData();
  }, [isAdmin, user]);

  // Listen for order status changes to refresh all data
  useEffect(() => {
    const handleOrderStatusChange = () => {
      console.log('Order status change detected, refreshing data...');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const handleMigration = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform migration.",
        variant: "destructive"
      });
      return;
    }

    try {
      await MigrationService.performFullMigration();
      setShowMigrationButton(false);
      setRefreshTrigger(prev => prev + 1); // Refresh the data
      toast({
        title: "Migration Successful",
        description: "Your data has been successfully migrated to Supabase.",
      });
    } catch (error) {
      console.error("Migration failed:", error);
      toast({
        title: "Migration Failed",
        description: "There was an error migrating your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Determine page status filter based on current route
  const getStatusFilterFromPath = (path: string): OrderStatus | null => {
    console.log('Getting status filter for path:', path);
    switch (path) {
      case "/complaints":
        return "Complaint";
      case "/completed":
        return "Resolved";
      case "/cancelled":
        return "Cancelled";
      case "/invoice-sent":
        return "Invoice Sent";
      case "/invoice-paid":
        return "Invoice Paid";
      case "/deleted":
        return "Deleted";
      case "/reviews":
        return "Review";
      default:
        return null;
    }
  };

  const pathStatusFilter = getStatusFilterFromPath(path);
  const isDashboardHome = path === "/dashboard";

  console.log('Current path:', path);
  console.log('Path status filter:', pathStatusFilter);

  // Get page title based on current route
  const getPageTitle = () => {
    if (isDashboardHome) return "Dashboard";
    
    const item = path.substring(1); // Remove leading slash
    return item.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleRefresh = () => {
    // Trigger a refresh to update our data
    console.log('Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  };

  // Reset active tab when path changes and trigger a refresh
  useEffect(() => {
    console.log('Path changed to:', path);
    // Only apply tabs for active orders
    if (path === "/active-orders") {
      setActiveTab("All");
    }
    // Force refresh when path changes to ensure correct orders are displayed
    setRefreshTrigger(prev => prev + 1);
  }, [path]);

  // Show loading state if user is not authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={userRole}>
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Please log in to access the dashboard.</p>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <>
      <TemporaryNotificationBanner />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={userRole}>
          <div className="space-y-6">
            <DashboardHeader 
              title={getPageTitle()}
              description={
                isDashboardHome 
                  ? "Here's an overview of your order statuses" 
                  : `Manage and track all ${getPageTitle().toLowerCase()} in the system`
              }
              onCreateOrder={isAdmin ? () => setCreateModalOpen(true) : undefined}
            />
            
            {/* Team Encouragement Messages - Only on dashboard home */}
            {isDashboardHome && (
              <TeamEncouragement />
            )}
            
            {/* Migration button for admins if localStorage data exists */}
            {isAdmin && showMigrationButton && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      LocalStorage Data Detected
                    </h3>
                    <p className="text-sm text-blue-600 mt-1">
                      Migrate your existing orders and companies to Supabase for better performance and reliability.
                    </p>
                  </div>
                  <Button onClick={handleMigration} variant="outline" className="ml-4">
                    Migrate to Supabase
                  </Button>
                </div>
              </div>
            )}
            
            {isDashboardHome && (
              <div className="space-y-4">
                <PaymentReminderCard />
                <DashboardCards />
              </div>
            )}
            {path === "/active-orders" && (
              <ActiveOrdersTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
            
            <OrderTable 
              onOrderClick={open} 
              statusFilter={path === "/active-orders" ? activeTab : pathStatusFilter} 
              refreshTrigger={refreshTrigger}
            />
            
            <OrderModal 
              order={currentOrder} 
              open={isOpen} 
              onClose={close}
              userRole={userRole}
            />

            <CreateOrderModal
              open={createModalOpen}
              onClose={() => {
                setCreateModalOpen(false);
                // Also refresh the table when a new order is created
                handleRefresh();
              }}
            />
          </div>
        </Layout>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
