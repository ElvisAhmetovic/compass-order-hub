import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { PaymentReminderLog } from '@/services/paymentReminderLogService';

interface UsePaymentReminderDueNotificationsReturn {
  dueCount: number;
  clearDueCount: () => void;
}

export const usePaymentReminderDueNotifications = (): UsePaymentReminderDueNotificationsReturn => {
  const [dueCount, setDueCount] = useState(0);
  const { user } = useAuth();
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasInteractedRef = useRef(false);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      hasInteractedRef.current = true;
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!hasInteractedRef.current || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a more attention-grabbing double beep
      const playBeep = (time: number, frequency: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, time + 0.2);
        
        oscillator.start(time);
        oscillator.stop(time + 0.2);
      };

      const now = ctx.currentTime;
      playBeep(now, 880);       // A5
      playBeep(now + 0.25, 1047); // C6
      playBeep(now + 0.5, 1319);  // E6
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Fetch initial count of recent due reminders (sent in last 2 hours)
  useEffect(() => {
    if (!user) return;

    const fetchRecentDueCount = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('payment_reminder_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'sent')
        .gte('created_at', twoHoursAgo);

      if (!error && count) {
        setDueCount(count);
      }
    };

    fetchRecentDueCount();
  }, [user]);

  // Subscribe to real-time 'sent' logs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('payment-reminder-due-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_reminder_logs',
          filter: 'action=eq.sent'
        },
        (payload) => {
          const log = payload.new as PaymentReminderLog;
          console.log('Payment reminder sent notification received:', log);

          // Increment due count
          setDueCount(prev => prev + 1);

          // Play notification sound
          playNotificationSound();

          // Show toast notification
          const details = log.details as { remind_at?: string; emails_sent?: number } | null;
          const price = details && typeof details === 'object' ? (details as any).price : null;
          
          toast({
            title: "💰 Payment Reminder Due",
            description: `${log.company_name || 'Order'} - Payment follow-up is now due`,
            duration: 10000, // 10 seconds
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playNotificationSound]);

  const clearDueCount = useCallback(() => {
    setDueCount(0);
  }, []);

  return {
    dueCount,
    clearDueCount,
  };
};
