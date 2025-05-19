
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import OrdersTable from "@/components/dashboard/OrdersTable";
import OrderModal from "@/components/dashboard/OrderModal";
import { Order } from "@/types";

const Dashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Dashboard</h1>
          <p className="text-muted-foreground">
            View and manage all customer orders in one place.
          </p>
        </div>
        
        <OrdersTable onOrderClick={handleOrderClick} />
        
        <OrderModal 
          order={selectedOrder} 
          open={modalOpen} 
          onClose={closeModal} 
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
