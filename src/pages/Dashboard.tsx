
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import OrdersTable from "@/components/dashboard/OrdersTable";
import OrderModal from "@/components/dashboard/OrderModal";
import CreateOrderModal from "@/components/dashboard/CreateOrderModal";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Order, UserRole, OrderStatus } from "@/types";
import ActiveOrdersTabs from "@/components/dashboard/ActiveOrdersTabs";
import Sidebar from "@/components/dashboard/Sidebar";
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const path = location.pathname;
  
  // Set user role - in a real app, this would come from authentication
  const userRole: UserRole = "admin";

  // Determine page status filter based on current route
  const getStatusFilterFromPath = (path: string): OrderStatus | null => {
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

  // Get page title based on current route
  const getPageTitle = () => {
    if (isDashboardHome) return "Dashboard";
    
    const item = path.substring(1); // Remove leading slash
    return item.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    // After modal closes, trigger a refresh to update our data
    setRefreshTrigger(prev => prev + 1);
    // Small delay before resetting the selected order for smooth transition
    setTimeout(() => {
      setSelectedOrder(null);
    }, 300);
  };

  // Reset active tab when path changes and trigger a refresh
  useEffect(() => {
    // Only apply tabs for active orders
    if (path === "/active-orders") {
      setActiveTab("All");
    }
    // Force refresh when path changes to ensure correct orders are displayed
    setRefreshTrigger(prev => prev + 1);
  }, [path]);

  return (
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
              onCreateOrder={() => setCreateModalOpen(true)}
            />
            
            {isDashboardHome && <DashboardCards />}
            
            {path === "/active-orders" && (
              <ActiveOrdersTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
            
            <OrdersTable 
              onOrderClick={handleOrderClick} 
              statusFilter={path === "/active-orders" ? activeTab : pathStatusFilter} 
              key={`orders-table-${refreshTrigger}`} // Force re-render when data changes
            />
            
            <OrderModal 
              order={selectedOrder} 
              open={modalOpen} 
              onClose={closeModal}
              userRole={userRole}
            />

            <CreateOrderModal
              open={createModalOpen}
              onClose={() => {
                setCreateModalOpen(false);
                // Also refresh the table when a new order is created
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Dashboard;
