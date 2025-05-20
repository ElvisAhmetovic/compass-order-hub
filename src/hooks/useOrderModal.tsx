
import { useState } from "react";
import { Order } from "@/types";

export const useOrderModal = () => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = (order: Order) => {
    setCurrentOrder(order);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    // Small delay before resetting the selected order for smooth transition
    setTimeout(() => {
      setCurrentOrder(null);
    }, 300);
  };

  return {
    currentOrder,
    isOpen,
    open,
    close
  };
};

export default useOrderModal;
