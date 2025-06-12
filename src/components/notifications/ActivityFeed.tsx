
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'order_update' | 'task_created' | 'message_sent' | 'status_change';
  title: string;
  description: string;
  actor_name: string;
  created_at: string;
  order_id?: string;
  metadata?: any;
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      try {
        // Fetch recent order status changes
        const { data: statusChanges } = await supabase
          .from('order_status_history')
          .select('*')
          .order('changed_at', { ascending: false })
          .limit(10);

        // Fetch recent messages
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch recent tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        // Combine and format activities
        const formattedActivities: ActivityItem[] = [];

        statusChanges?.forEach(change => {
          formattedActivities.push({
            id: change.id,
            type: 'status_change',
            title: 'Order Status Updated',
            description: `Order status changed to ${change.status}`,
            actor_name: change.actor_name || 'System',
            created_at: change.changed_at,
            order_id: change.order_id
          });
        });

        messages?.forEach(message => {
          formattedActivities.push({
            id: message.id,
            type: 'message_sent',
            title: 'New Team Message',
            description: message.content.substring(0, 100) + '...',
            actor_name: message.sender_name,
            created_at: message.created_at
          });
        });

        tasks?.forEach(task => {
          formattedActivities.push({
            id: task.id,
            type: 'task_created',
            title: 'Task Created',
            description: task.title,
            actor_name: task.assigned_by_name || 'System',
            created_at: task.created_at,
            order_id: task.order_id
          });
        });

        // Sort by created_at descending
        formattedActivities.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setActivities(formattedActivities.slice(0, 20));
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('activity-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchActivities();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_status_history'
      }, () => {
        fetchActivities();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'order_update':
      case 'status_change':
        return '📋';
      case 'task_created':
        return '✅';
      case 'message_sent':
        return '💬';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'order_update':
      case 'status_change':
        return 'bg-blue-100 text-blue-800';
      case 'task_created':
        return 'bg-green-100 text-green-800';
      case 'message_sent':
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
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
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
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="text-lg">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{activity.title}</span>
                      <Badge className={`text-xs ${getActivityColor(activity.type)}`}>
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>by {activity.actor_name}</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
