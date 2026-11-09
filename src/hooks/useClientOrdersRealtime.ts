import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/ClientLanguageContext";

interface UseClientOrdersRealtimeOptions {
  onOrderUpdate?: (orderId: string) => void;
  orderId?: string; // Optional: for single order subscription
  showToast?: boolean;
}

/**
 * Live order updates for the portal. The subscription is created once per
 * user/order (callbacks are read through refs, so re-renders never reconnect).
 * Without an orderId it listens to new and changed orders; the database's
 * access rules decide which orders this client receives.
 */
export const useClientOrdersRealtime = (options: UseClientOrdersRealtimeOptions = {}) => {
  const { onOrderUpdate, orderId, showToast = true } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);

  const latest = useRef({ onOrderUpdate, showToast, toast, t });
  latest.current = { onOrderUpdate, showToast, toast, t };

  useEffect(() => {
    if (!user?.id) return;

    const suffix = Math.random().toString(36).slice(2);
    const channelName = orderId ? `client-order-${orderId}-${suffix}` : `client-orders-${user.id}-${suffix}`;

    const handle = (kind: "INSERT" | "UPDATE") => (payload: { new: { id?: string } }) => {
      const id = payload.new?.id;
      if (!id || (orderId && id !== orderId)) return;
      const { onOrderUpdate: cb, showToast: show, toast: notify, t: tr } = latest.current;
      cb?.(id);
      if (show) {
        notify(kind === "INSERT"
          ? { title: tr("realtime.newOrder"), description: tr("realtime.newOrderDesc") }
          : { title: tr("realtime.orderUpdated"), description: tr("realtime.orderUpdatedDesc") });
      }
    };

    let channel = supabase.channel(channelName).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders", ...(orderId ? { filter: `id=eq.${orderId}` } : {}) },
      handle("UPDATE"),
    );
    if (!orderId) {
      channel = channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, handle("INSERT"));
    }
    channel.subscribe((status) => setIsConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, orderId]);

  return { isConnected };
};
