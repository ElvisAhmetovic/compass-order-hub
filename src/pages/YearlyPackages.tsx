
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import OrderTable from "@/components/dashboard/OrderTable";
import OrderModal from "@/components/dashboard/OrderModal";
import CreateYearlyPackageModal from "@/components/dashboard/CreateYearlyPackageModal";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { UserRole } from "@/types";
import Sidebar from "@/components/dashboard/Sidebar";
import { useOrderModal } from "@/hooks/useOrderModal";
import { useAuth } from "@/context/AuthContext";

const YearlyPackages = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Use the order modal hook - same as dashboard
  const { currentOrder, isOpen, open, close } = useOrderModal();
  
  // Get user role from auth context - same as dashboard
  const { user } = useAuth();
  const userRole: UserRole = user?.role || "user";
  const isAdmin = userRole === "admin";

  // Listen for order status changes to refresh all data - same as dashboard
  useEffect(() => {
    const handleOrderStatusChange = () => {
      console.log('YearlyPackages: Order status change detected, refreshing data...');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const handleRefresh = () => {
    console.log('YearlyPackages: Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateModalClose = () => {
    setCreateModalOpen(false);
    handleRefresh();
  };

  // Show loading state if user is not authenticated - same as dashboard
  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={userRole}>
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Please log in to access yearly packages.</p>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={userRole}>
          <div className="space-y-6">
            <DashboardHeader 
              title="Yearly Packages"
              description="Manage and track all yearly package orders separately from regular orders"
              onCreateOrder={isAdmin ? () => setCreateModalOpen(true) : undefined}
              createButtonText="Create Yearly Package"
            />
            
            <DashboardCards isYearlyPackages={true} />
            
            <OrderTable 
              onOrderClick={open} 
              statusFilter={null}
              refreshTrigger={refreshTrigger}
              isYearlyPackages={true}
            />
            
            <OrderModal 
              order={currentOrder} 
              open={isOpen} 
              onClose={close}
              userRole={userRole}
            />

            <CreateYearlyPackageModal
              open={createModalOpen}
              onClose={handleCreateModalClose}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default YearlyPackages;
