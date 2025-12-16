import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Bell, Clock, Edit, Ban, Send, ChevronRight, Loader2, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaymentReminderLogService, PaymentReminderLog } from '@/services/paymentReminderLogService';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PaymentReminderActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [, setSearchParams] = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const data = await PaymentReminderLogService.getRecentLogs(PAGE_SIZE, offset);
    
    if (append) {
      setLogs((prev) => [...prev, ...data]);
    } else {
      setLogs(data);
    }
    
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchLogs(logs.length, true);
    }
  }, [loadingMore, hasMore, logs.length, fetchLogs]);

  useEffect(() => {
    if (!isOpen) return;

    fetchLogs(0, false);

    // Subscribe to real-time updates
    const unsubscribe = PaymentReminderLogService.subscribeToLogs((newLog) => {
      setLogs((prev) => [newLog, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, fetchLogs]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  // Track scroll position for "Jump to top" button
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 200);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isOpen, loading]);

  const scrollToTop = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewOrder = (orderId: string) => {
    setSearchParams({ orderId });
    onClose();
  };

  // Group logs by date
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const groupedLogs = useMemo(() => {
    const groups: { label: string; date: Date; logs: PaymentReminderLog[] }[] = [];
    let currentGroup: { label: string; date: Date; logs: PaymentReminderLog[] } | null = null;

    logs.forEach((log) => {
      const logDate = new Date(log.created_at);
      const dayStart = startOfDay(logDate);
      const label = getDateLabel(logDate);

      if (!currentGroup || currentGroup.label !== label) {
        currentGroup = { label, date: dayStart, logs: [log] };
        groups.push(currentGroup);
      } else {
        currentGroup.logs.push(log);
      }
    });

    return groups;
  }, [logs]);

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
      <div className="flex-1 relative">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading activity...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No reminder activity yet
          </div>
        ) : (
          <div className="p-2">
            {groupedLogs.map((group) => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="sticky top-0 bg-card/95 backdrop-blur-sm py-2 px-3 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                
                {group.logs.map((log) => {
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
                            {format(new Date(log.created_at), 'HH:mm')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!hasMore && logs.length > 0 && (
                <p className="text-xs text-muted-foreground">No more entries</p>
              )}
            </div>
          </div>
        )}
        </ScrollArea>
        
        {/* Jump to top button */}
        {showScrollTop && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg z-10"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentReminderActivityPanel;
