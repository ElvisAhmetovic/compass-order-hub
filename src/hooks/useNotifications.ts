
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { NotificationService, Notification } from '@/services/notificationService';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const refetch = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchWithRetry(() => NotificationService.getNotifications(user.id));
      setNotifications(data);
    } catch (error) {
      console.error('useNotifications: failed to fetch notifications', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    refetch();

    const handleNotificationsChanged = () => refetch();
    window.addEventListener('notifications:changed', handleNotificationsChanged);

    const channel = supabase
      .channel(`notifications-shared-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const updated = payload.new as Notification;
        setNotifications(prev =>
          prev.map(n => n.id === updated.id ? updated : n)
        );
      })
      .subscribe();

    return () => {
      window.removeEventListener('notifications:changed', handleNotificationsChanged);
      channel.unsubscribe();
    };
  }, [user, refetch]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const unreadSupportCount = notifications.filter(
    n => !n.read && n.action_url?.startsWith('/support/')
  ).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await NotificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user]);

  return {
    notifications,
    unreadCount,
    unreadSupportCount,
    markAsRead,
    markAllAsRead,
    refetch
  };
};
