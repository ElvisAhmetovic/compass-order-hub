
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGlobalChatNotifications = () => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      console.log('🔔 Global chat notifications: No user found, skipping setup');
      return;
    }

    console.log('🔔 Setting up GLOBAL chat notification listener for user:', user.id);

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      console.log('🧹 Cleaning up existing global subscription');
      supabase.removeChannel(subscriptionRef.current);
    }

    // Subscribe to ALL new messages in team chat
    const messagesSubscription = supabase
      .channel('global-team-messages-v6') // Updated channel version
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

        // Only show global notifications and play sound for messages from OTHER users
        if (newMessage.sender_id !== user.id) {
          console.log('🔊 PLAYING GLOBAL SOUND! Message from:', newMessage.sender_name, 'to user:', user.id);
          
          // Play notification sound immediately
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create distinctive double beep
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            
            console.log('✅ Global notification sound played successfully');
          } catch (error) {
            console.error('❌ Error playing global notification sound:', error);
          }
          
          // Show global toast notification
          toast({
            title: `💬 New team message from ${newMessage.sender_name}`,
            description: newMessage.content ? 
              (newMessage.content.length > 80 ? 
                newMessage.content.substring(0, 80) + '...' : 
                newMessage.content
              ) : 'New message',
            duration: 5000,
          });

        } else {
          console.log('⏭️ Skipping global notification - message is from current user');
        }
      })
      .subscribe((status) => {
        console.log('🔔 GLOBAL chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to GLOBAL chat notifications');
        } else if (status === 'CLOSED') {
          console.log('❌ Global chat subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Global chat subscription error');
        }
      });

    subscriptionRef.current = messagesSubscription;

    return () => {
      console.log('🧹 Cleaning up GLOBAL chat notification listener');
      if (subscriptionRef.current) {
        supabase.remove

(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user]);

  // Return connection status for debugging
  return {
    isConnected: subscriptionRef.current !== null,
    userId: user?.id
  };
};
