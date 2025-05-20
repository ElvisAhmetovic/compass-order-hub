
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import OrdersTable from "@/components/dashboard/OrdersTable";
import OrderModal from "@/components/dashboard/OrderModal";
import CreateOrderModal from "@/components/dashboard/CreateOrderModal";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Order, UserRole } from "@/types";
import ActiveOrdersTabs from "@/components/dashboard/ActiveOrdersTabs";
import Sidebar from "@/components/dashboard/Sidebar";
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");
  const location = useLocation();
  const isDashboardHome = location.pathname === "/dashboard";
  
  // Set user role - in a real app, this would come from authentication
  const userRole: UserRole = "admin";

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    // Small delay before resetting the selected order for smooth transition
    setTimeout(() => {
      setSelectedOrder(null);
    }, 300);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={userRole}>
          <div className="space-y-6">
            <DashboardHeader 
              title={isDashboardHome ? "Dashboard" : "Active Orders"}
              description={
                isDashboardHome 
                  ? "Here's an overview of your order statuses" 
                  : "Manage and track all active orders in the system"
              }
              onCreateOrder={() => setCreateModalOpen(true)}
            />
            
            {isDashboardHome && <DashboardCards />}
            
            <ActiveOrdersTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <OrdersTable onOrderClick={handleOrderClick} statusFilter={activeTab} />
            
            <OrderModal 
              order={selectedOrder} 
              open={modalOpen} 
              onClose={closeModal}
              userRole={userRole}
            />

            <CreateOrderModal
              open={createModalOpen}
              onClose={() => setCreateModalOpen(false)}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Dashboard;
