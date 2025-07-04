
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import OrderTable from "@/components/dashboard/OrderTable";
import OrderModal from "@/components/dashboard/OrderModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Order, UserRole } from "@/types";
import Sidebar from "@/components/dashboard/Sidebar";
import { useOrderModal } from "@/hooks/useOrderModal";
import { useAuth } from "@/context/AuthContext";

const Reviews = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any early returns or conditional logic
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const { currentOrder, isOpen, open, close } = useOrderModal();
  
  // Now we can use the hook values in conditional logic
  const userRole: UserRole = user?.role || "user";

  // Listen for order status changes to refresh data
  useEffect(() => {
    const handleOrderStatusChange = () => {
      console.log('Order status change detected in Reviews, refreshing data...');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const handleRefresh = () => {
    console.log('Manual refresh triggered in Reviews');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={userRole}>
          <div className="space-y-6">
            <DashboardHeader 
              title="Reviews"
              description="Manage and track all review orders in the system. Orders can have multiple statuses - an order can be in Review and also have other statuses like Invoice Sent or Complaint."
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Review Orders
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Orders that have been manually sent to the review section. These orders may also have other statuses active simultaneously.
                  </p>
                </div>
              </div>
            </div>
            
            <OrderTable 
              onOrderClick={open} 
              statusFilter="Review"
              refreshTrigger={refreshTrigger}
            />
            
            <OrderModal 
              order={currentOrder} 
              open={isOpen} 
              onClose={close}
              userRole={userRole}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Reviews;
