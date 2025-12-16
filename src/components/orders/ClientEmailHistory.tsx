import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/currencyUtils";
import { Mail, User, Clock, MessageSquare, Users, Inbox } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";

interface EmailLog {
  id: string;
  order_id: string;
  sent_to: string;
  sent_by: string | null;
  sent_by_name: string;
  company_name: string;
  order_price: number | null;
  currency: string;
  custom_message: string | null;
  team_emails_sent: number;
  created_at: string;
}

interface ClientEmailHistoryProps {
  orderId: string;
}

const ClientEmailHistory = ({ orderId }: ClientEmailHistoryProps) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("client_email_logs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching email logs:", error);
      } else {
        setLogs(data || []);
      }
      setIsLoading(false);
    };

    fetchLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`client_email_logs_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_email_logs",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as EmailLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No Client Emails Sent</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          No payment reminder emails have been sent to the client for this order yet.
          Use the "Send to Client" button to send a reminder.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Client Email History
        </h3>
        <span className="text-sm text-muted-foreground">
          {logs.length} email{logs.length !== 1 ? "s" : ""} sent
        </span>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-card border border-border rounded-lg p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Payment Reminder Sent</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "PPP 'at' HH:mm", { locale: de })}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: de })}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sent to:</span>
                <span className="font-medium truncate">{log.sent_to}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sent by:</span>
                <span className="font-medium">{log.sent_by_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-primary">
                  {formatCurrency(log.order_price || 0, log.currency || "EUR")}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Team notified:</span>
                <span className="font-medium">{log.team_emails_sent} members</span>
              </div>
            </div>

            {/* Custom Message */}
            {log.custom_message && (
              <div className="bg-muted/50 rounded-md p-3 mt-2">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Custom Message:</p>
                    <p className="text-sm italic">"{log.custom_message}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientEmailHistory;