import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Bell, Mail, User, DollarSign, FileText, Paperclip, ChevronDown, ChevronUp, Inbox, Building, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/currencyUtils";

interface PaymentReminderLog {
  id: string;
  order_id: string;
  sent_to: string;
  sent_by_name: string;
  company_name: string;
  order_price: number | null;
  currency: string | null;
  custom_message: string | null;
  team_emails_sent: number | null;
  created_at: string;
  email_subject: string | null;
  template_name: string | null;
  invoice_number: string | null;
  contact_phone: string | null;
}

interface PaymentRemindersSentTabProps {
  orderId: string;
}

const PaymentRemindersSentTab = ({ orderId }: PaymentRemindersSentTabProps) => {
  const [logs, setLogs] = useState<PaymentReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_email_logs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment reminder logs:", error);
      } else {
        setLogs((data || []) as PaymentReminderLog[]);
      }
      setLoading(false);
    };

    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel(`client-email-logs-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_email_logs",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as PaymentReminderLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Inbox className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No payment reminders sent</p>
        <p className="text-sm">Payment reminders sent for this order will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <p className="text-sm text-muted-foreground mb-4">
        {logs.length} payment reminder{logs.length !== 1 ? "s" : ""} sent
      </p>

      {logs.map((log) => {
        const isExpanded = expandedIds.has(log.id);
        const relativeTime = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });

        return (
          <div
            key={log.id}
            className="border border-border rounded-lg p-4 bg-card hover:bg-accent/30 transition-colors"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-medium">{formatDate(log.created_at)}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{relativeTime}</span>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm mt-2">
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Company:</span>
                <span className="font-medium truncate">{log.company_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Sent by:</span>
                <span className="font-medium truncate">{log.sent_by_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium truncate">{log.sent_to}</span>
              </div>
              {log.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium truncate">{log.contact_phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  {log.order_price != null
                    ? formatCurrency(log.order_price, log.currency || "EUR")
                    : "N/A"}
                </span>
              </div>
              {log.email_subject && (
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium truncate">{log.email_subject}</span>
                </div>
              )}
              {log.template_name && (
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Template:</span>
                  <Badge variant="secondary" className="text-xs">{log.template_name}</Badge>
                </div>
              )}
              {log.invoice_number && (
                <div className="flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Invoice:</span>
                  <Badge variant="outline" className="text-xs">{log.invoice_number}</Badge>
                </div>
              )}
            </div>

            {/* Custom message collapsible */}
            {log.custom_message && (
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(log.id)}>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline mt-3 cursor-pointer">
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isExpanded ? "Hide message" : "Show message"}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="bg-muted/50 rounded-md p-3 text-sm italic text-muted-foreground border-l-2 border-primary/30">
                    "{log.custom_message}"
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PaymentRemindersSentTab;
