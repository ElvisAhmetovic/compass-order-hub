import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UseClientOrdersRealtimeOptions {
  onOrderUpdate?: (orderId: string) => void;
  orderId?: string; // Optional: for single order subscription
  showToast?: boolean;
}

export const useClientOrdersRealtime = (options: UseClientOrdersRealtimeOptions = {}) => {
  const { onOrderUpdate, orderId, showToast = true } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleOrderUpdate = useCallback((payload: { new: { id: string } }) => {
    const updatedOrderId = payload.new?.id;
    
    if (updatedOrderId) {
      console.log("[Realtime] Order updated:", updatedOrderId);
      
      // If we're filtering by orderId and this isn't our order, skip
      if (orderId && updatedOrderId !== orderId) {
        return;
      }
      
      // Call the callback
      onOrderUpdate?.(updatedOrderId);
      
      // Show toast notification
      if (showToast) {
        toast({
          title: "Order Updated",
          description: "Your order status has been updated.",
        });
      }
    }
  }, [orderId, onOrderUpdate, showToast, toast]);

  useEffect(() => {
    if (!user?.id) {
      console.log("[Realtime] No user, skipping subscription");
      return;
    }

    const channelName = orderId 
      ? `client-order-${orderId}-${user.id}` 
      : `client-orders-${user.id}`;

    console.log("[Realtime] Setting up subscription:", channelName);

    // Build filter - either for a specific order or all orders for this client
    const filter = orderId
      ? `id=eq.${orderId}`
      : `client_id=eq.${user.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter,
        },
        handleOrderUpdate
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      console.log("[Realtime] Cleaning up subscription:", channelName);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, orderId, handleOrderUpdate]);

  return { isConnected };
};
