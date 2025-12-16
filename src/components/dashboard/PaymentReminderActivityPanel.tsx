import React, { useState, useEffect } from 'react';
import { X, Bell, Clock, Edit, Ban, Send, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaymentReminderLogService, PaymentReminderLog } from '@/services/paymentReminderLogService';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PaymentReminderActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const actionConfig = {
  created: {
    icon: Bell,
    label: 'created reminder',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  updated: {
    icon: Edit,
    label: 'updated reminder',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  cancelled: {
    icon: Ban,
    label: 'cancelled reminder',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  sent: {
    icon: Send,
    label: 'reminder sent',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
};

export const PaymentReminderActivityPanel: React.FC<PaymentReminderActivityPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<PaymentReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!isOpen) return;

    const fetchLogs = async () => {
      setLoading(true);
      const data = await PaymentReminderLogService.getRecentLogs(30);
      setLogs(data);
      setLoading(false);
    };

    fetchLogs();

    // Subscribe to real-time updates
    const unsubscribe = PaymentReminderLogService.subscribeToLogs((newLog) => {
      setLogs((prev) => [newLog, ...prev].slice(0, 30));
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const handleViewOrder = (orderId: string) => {
    setSearchParams({ orderId });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Activity Log</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading activity...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No reminder activity yet
          </div>
        ) : (
          <div className="p-2">
            {logs.map((log) => {
              const config = actionConfig[log.action as keyof typeof actionConfig] || actionConfig.created;
              const Icon = config.icon;
              const details = log.details as Record<string, any> | null;

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleViewOrder(log.order_id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-full', config.bgColor)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {log.actor_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.label}
                      </p>
                      <p className="text-sm text-foreground font-medium truncate mt-1">
                        {log.company_name || 'Unknown Company'}
                      </p>
                      
                      {/* Additional details */}
                      {details && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {details.remind_at && (
                            <p>Due: {format(new Date(details.remind_at), 'dd.MM.yyyy HH:mm')}</p>
                          )}
                          {details.old_date && details.new_date && (
                            <p>
                              {format(new Date(details.old_date), 'dd.MM')} → {format(new Date(details.new_date), 'dd.MM.yyyy')}
                            </p>
                          )}
                          {details.note && (
                            <p className="truncate italic">"{details.note}"</p>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default PaymentReminderActivityPanel;
