
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import OrdersTable from "@/components/dashboard/OrdersTable";
import OrderModal from "@/components/dashboard/OrderModal";
import CreateOrderModal from "@/components/dashboard/CreateOrderModal";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Plus } from "lucide-react";
import ActiveOrdersTabs from "@/components/dashboard/ActiveOrdersTabs";
import Sidebar from "@/components/dashboard/Sidebar";

const Dashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");

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
        <Layout>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Active Orders</h1>
                <p className="text-muted-foreground">
                  Manage and track all active orders in the system
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </div>
            </div>
            
            <ActiveOrdersTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <OrdersTable onOrderClick={handleOrderClick} statusFilter={activeTab} />
            
            <OrderModal 
              order={selectedOrder} 
              open={modalOpen} 
              onClose={closeModal} 
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
