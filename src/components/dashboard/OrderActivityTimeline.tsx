
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MessageSquare, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  actor_name?: string;
  actor_id?: string;
  created_at: string;
  order_id: string;
}

interface OrderActivityTimelineProps {
  orderId: string;
}

const OrderActivityTimeline = ({ orderId }: OrderActivityTimelineProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserName = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return 'Unknown User';
      }

      if (data) {
        return `${data.first_name} ${data.last_name}`.trim() || 'Unknown User';
      }

      return 'Unknown User';
    } catch (error) {
      console.error('Error in fetchUserName:', error);
      return 'Unknown User';
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch from order_status_history
        const { data: statusHistory, error: statusError } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', orderId)
          .order('changed_at', { ascending: false });

        if (statusError) throw statusError;

        // Fetch from order_audit_logs
        const { data: auditLogs, error: auditError } = await supabase
          .from('order_audit_logs')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false });

        if (auditError) throw auditError;

        // Combine and format activities
        const statusActivities: ActivityItem[] = (statusHistory || []).map(item => ({
          id: item.id,
          action: 'Status Change',
          details: `Order status changed to ${item.status}${item.details ? ` - ${item.details}` : ''}`,
          actor_name: item.actor_name,
          actor_id: item.actor_id,
          created_at: item.changed_at,
          order_id: item.order_id
        }));

        const auditActivities: ActivityItem[] = await Promise.all(
          (auditLogs || []).map(async (item) => {
            let actorName = 'System';
            
            // If we have actor_id but no actor_name, fetch the user's name
            if (item.actor_id && !item.actor_name) {
              actorName = await fetchUserName(item.actor_id);
            } else if (item.actor_name) {
              actorName = item.actor_name;
            }

            return {
              id: item.id,
              action: item.action,
              details: item.details || '',
              actor_name: actorName,
              actor_id: item.actor_id,
              created_at: item.created_at,
              order_id: item.order_id
            };
          })
        );

        const combinedActivities = [...statusActivities, ...auditActivities]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setActivities(combinedActivities);
      } catch (error) {
        console.error('Error fetching order activities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchActivities();

      // Subscribe to real-time updates
      const statusSubscription = supabase
        .channel(`order-status-${orderId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'order_status_history',
          filter: `order_id=eq.${orderId}`
        }, () => {
          fetchActivities();
        })
        .subscribe();

      const auditSubscription = supabase
        .channel(`order-audit-${orderId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'order_audit_logs',
          filter: `order_id=eq.${orderId}`
        }, () => {
          fetchActivities();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(statusSubscription);
        supabase.removeChannel(auditSubscription);
      };
    }
  }, [orderId]);

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'status change':
        return <AlertTriangle className="h-4 w-4" />;
      case 'order created':
      case 'yearly package created':
        return <FileText className="h-4 w-4" />;
      case 'order assigned':
      case 'order unassigned':
        return <User className="h-4 w-4" />;
      case 'order updated':
        return <FileText className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'file upload':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'status change':
        return 'bg-blue-100 text-blue-800';
      case 'order created':
      case 'yearly package created':
        return 'bg-green-100 text-green-800';
      case 'order assigned':
      case 'order unassigned':
        return 'bg-purple-100 text-purple-800';
      case 'order updated':
        return 'bg-orange-100 text-orange-800';
      case 'comment':
        return 'bg-green-100 text-green-800';
      case 'file upload':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                      {getActivityIcon(activity.action)}
                    </div>
                    {index !== activities.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-1">
                      {activity.details}
                    </p>
                    {activity.actor_name && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {activity.actor_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default OrderActivityTimeline;
