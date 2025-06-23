
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import OrderTable from "@/components/dashboard/OrderTable";
import OrderModal from "@/components/dashboard/OrderModal";
import CreateOrderModal from "@/components/dashboard/CreateOrderModal";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { UserRole } from "@/types";
import Sidebar from "@/components/dashboard/Sidebar";
import { useOrderModal } from "@/hooks/useOrderModal";
import { useAuth } from "@/context/AuthContext";

const Trustpilot = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { currentOrder, isOpen, open, close } = useOrderModal();
  
  const { user } = useAuth();
  const userRole: UserRole = user?.role || "user";
  const isAdmin = userRole === "admin";

  useEffect(() => {
    const handleOrderStatusChange = () => {
      console.log('Trustpilot: Order status change detected, refreshing data...');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const handleRefresh = () => {
    console.log('Trustpilot: Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateModalClose = () => {
    setCreateModalOpen(false);
    handleRefresh();
  };

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={userRole}>
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Please log in to access Trustpilot orders.</p>
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
              title="Trustpilot Orders"
              description="Manage and track all Trustpilot-related orders"
              onCreateOrder={isAdmin ? () => setCreateModalOpen(true) : undefined}
              createButtonText="Create Trustpilot Order"
            />
            
            <DashboardCards statusFilter="Trustpilot" />
            
            <OrderTable 
              onOrderClick={open} 
              statusFilter="Trustpilot"
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
              onClose={handleCreateModalClose}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Trustpilot;
