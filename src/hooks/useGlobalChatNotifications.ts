
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
      console.log('🔔 Global chat notifications: No user found, skipping setup');
      return;
    }

    console.log('🔔 Setting up ENHANCED global chat notification listener for user:', user.id);

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      console.log('🧹 Cleaning up existing global subscription');
      supabase.removeChannel(subscriptionRef.current);
    }

    // Subscribe to ALL new messages in team chat with enhanced real-time
    const messagesSubscription = supabase
      .channel('global-team-messages-v4') // Updated channel version
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
          timestamp: new Date().toISOString(),
          channelId: newMessage.channel_id
        });

        // CRITICAL: Play sound for EVERYONE except the sender
        if (newMessage.sender_id !== user.id) {
          console.log('🔊 PLAYING SOUND! Message from:', newMessage.sender_name, 'to user:', user.id);
          
          // Trigger sound immediately with priority
          setShouldPlaySound(prev => {
            console.log('🔊 Sound trigger state change: false -> true');
            return true;
          });
          
          // Show enhanced toast notification
          toast({
            title: `💬 New team message from ${newMessage.sender_name}`,
            description: newMessage.content ? 
              (newMessage.content.length > 80 ? 
                newMessage.content.substring(0, 80) + '...' : 
                newMessage.content
              ) : 'New message',
            duration: 6000, // Longer duration
          });

          // Reset sound trigger after delay
          setTimeout(() => {
            console.log('🔇 Resetting sound trigger');
            setShouldPlaySound(prev => {
              console.log('🔇 Sound trigger state change: true -> false');
              return false;
            });
          }, 1500); // Slightly longer delay

        } else {
          console.log('⏭️ Skipping notification - message is from current user');
        }
      })
      .subscribe((status) => {
        console.log('🔔 ENHANCED Global chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to ENHANCED global chat notifications');
        } else if (status === 'CLOSED') {
          console.log('❌ Global chat subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Global chat subscription error');
        }
      });

    subscriptionRef.current = messagesSubscription;

    return () => {
      console.log('🧹 Cleaning up ENHANCED global chat notification listener');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user]);

  // Enhanced debug logging
  useEffect(() => {
    if (shouldPlaySound) {
      console.log('🔊 ENHANCED Sound trigger activated at:', new Date().toISOString());
    } else {
      console.log('🔇 Sound trigger deactivated at:', new Date().toISOString());
    }
  }, [shouldPlaySound]);

  // Return connection status for debugging
  return {
    isConnected: subscriptionRef.current !== null,
    userId: user?.id
  };
};
