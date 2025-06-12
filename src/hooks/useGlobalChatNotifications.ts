
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { toast } from '@/hooks/use-toast';

export const useGlobalChatNotifications = () => {
  const [shouldPlaySound, setShouldPlaySound] = useState(false);
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  // Play notification sound when triggered
  useNotificationSound(shouldPlaySound);

  useEffect(() => {
    if (!user) {
      console.log('Global chat notifications: No user found, skipping setup');
      return;
    }

    console.log('🔔 Setting up global chat notification listener for user:', user.id);

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      console.log('Cleaning up existing subscription');
      supabase.removeChannel(subscriptionRef.current);
    }

    // Subscribe to ALL new messages in team chat
    const messagesSubscription = supabase
      .channel('global-team-messages-v3') // Changed channel name to ensure fresh subscription
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        
        console.log('🔔 GLOBAL NOTIFICATION: New message detected!', {
          messageId: newMessage.id,
          senderId: newMessage.sender_id,
          senderName: newMessage.sender_name,
          currentUserId: user.id,
          content: newMessage.content?.substring(0, 50) + '...',
          timestamp: new Date().toISOString()
        });

        // CRITICAL: Play sound for EVERYONE except the sender
        if (newMessage.sender_id !== user.id) {
          console.log('🔊 PLAYING SOUND! Message from:', newMessage.sender_name, 'to user:', user.id);
          
          // Trigger sound immediately
          setShouldPlaySound(true);
          
          // Show toast notification with more details
          toast({
            title: `💬 New team message from ${newMessage.sender_name}`,
            description: newMessage.content ? 
              (newMessage.content.length > 80 ? 
                newMessage.content.substring(0, 80) + '...' : 
                newMessage.content
              ) : 'New message',
            duration: 5000,
          });

          // Reset sound trigger after delay
          setTimeout(() => {
            console.log('🔇 Resetting sound trigger');
            setShouldPlaySound(false);
          }, 1000);

        } else {
          console.log('⏭️ Skipping notification - message is from current user');
        }
      })
      .subscribe((status) => {
        console.log('🔔 Global chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to global chat notifications');
        } else if (status === 'CLOSED') {
          console.log('❌ Global chat subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Global chat subscription error');
        }
      });

    subscriptionRef.current = messagesSubscription;

    return () => {
      console.log('🧹 Cleaning up global chat notification listener');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user]);

  // Debug: Log when sound state changes
  useEffect(() => {
    if (shouldPlaySound) {
      console.log('🔊 Sound trigger activated at:', new Date().toISOString());
    }
  }, [shouldPlaySound]);

  return null;
};
