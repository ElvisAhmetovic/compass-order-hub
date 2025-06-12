
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface SmartAlert {
  id: string;
  type: 'overdue_task' | 'urgent_order' | 'deadline_approaching' | 'new_message' | 'status_change';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  action_url?: string;
  metadata?: any;
  dismissed: boolean;
}

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [newAlertReceived, setNewAlertReceived] = useState(false);
  const { user } = useAuth();

  // Play sound when new alert is received
  useNotificationSound(newAlertReceived);

  useEffect(() => {
    if (!user) return;

    const checkForAlerts = async () => {
      const alerts: SmartAlert[] = [];

      try {
        // Check for overdue tasks
        const { data: overdueTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString());

        overdueTasks?.forEach(task => {
          alerts.push({
            id: `overdue-${task.id}`,
            type: 'overdue_task',
            title: 'Overdue Task',
            message: `Task "${task.title}" is overdue`,
            priority: 'high',
            created_at: task.due_date,
            dismissed: false,
            metadata: { task_id: task.id }
          });
        });

        // Check for urgent orders
        const { data: urgentOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('assigned_to', user.id)
          .eq('priority', 'urgent')
          .in('status', ['Created', 'In Progress']);

        urgentOrders?.forEach(order => {
          alerts.push({
            id: `urgent-${order.id}`,
            type: 'urgent_order',
            title: 'Urgent Order',
            message: `Urgent order for ${order.company_name} requires attention`,
            priority: 'critical',
            created_at: order.updated_at,
            dismissed: false,
            metadata: { order_id: order.id }
          });
        });

        // Check for approaching deadlines (next 24 hours)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { data: approachingDeadlines } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .eq('status', 'pending')
          .lt('due_date', tomorrow.toISOString())
          .gt('due_date', new Date().toISOString());

        approachingDeadlines?.forEach(task => {
          alerts.push({
            id: `deadline-${task.id}`,
            type: 'deadline_approaching',
            title: 'Deadline Approaching',
            message: `Task "${task.title}" is due soon`,
            priority: 'medium',
            created_at: task.due_date,
            dismissed: false,
            metadata: { task_id: task.id }
          });
        });

        setAlerts(alerts.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }));

      } catch (error) {
        console.error('Error checking for alerts:', error);
      }
    };

    checkForAlerts();

    // Check for alerts every 5 minutes
    const interval = setInterval(checkForAlerts, 5 * 60 * 1000);

    // Subscribe to real-time updates that might trigger new alerts
    const subscription = supabase
      .channel('smart-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        setNewAlertReceived(true);
        setTimeout(() => setNewAlertReceived(false), 1000);
        checkForAlerts();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, () => {
        checkForAlerts();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks'
      }, () => {
        checkForAlerts();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getPriorityColor = (priority: SmartAlert['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'overdue_task':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'urgent_order':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'deadline_approaching':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'new_message':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Smart Alerts
          <Badge variant="destructive" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{alert.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SmartAlerts;
