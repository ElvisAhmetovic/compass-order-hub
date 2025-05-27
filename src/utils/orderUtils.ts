
export const notifyOrdersUpdated = () => {
  // Dispatch custom event to notify components about order updates
  window.dispatchEvent(new CustomEvent('ordersUpdated'));
};

export const updateOrderInStorage = (updatedOrder: any) => {
  try {
    const ordersInStorage = JSON.parse(localStorage.getItem("orders") || "[]");
    const updatedOrders = ordersInStorage.map((o: any) => 
      o.id === updatedOrder.id ? updatedOrder : o
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    notifyOrdersUpdated();
    return true;
  } catch (error) {
    console.error("Error updating order in storage:", error);
    return false;
  }
};
