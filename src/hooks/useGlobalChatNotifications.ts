
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { toast } from '@/hooks/use-toast';

export const useGlobalChatNotifications = () => {
  const [shouldPlaySound, setShouldPlaySound] = useState(false);
  const { user } = useAuth();

  // Play notification sound when triggered
  useNotificationSound(shouldPlaySound);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up global chat notification listener for user:', user.id);

    // Subscribe to ALL new messages in team chat
    const messagesSubscription = supabase
      .channel('global-team-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        
        console.log('Global chat notification: New message detected:', {
          messageId: newMessage.id,
          senderId: newMessage.sender_id,
          senderName: newMessage.sender_name,
          currentUserId: user.id
        });

        // Play sound for EVERYONE except the sender
        if (newMessage.sender_id !== user.id) {
          console.log('Playing notification sound for all users (message from:', newMessage.sender_name, ')');
          
          // Trigger sound
          setShouldPlaySound(true);
          
          // Reset sound trigger after delay
          setTimeout(() => {
            console.log('Resetting global notification sound trigger');
            setShouldPlaySound(false);
          }, 1000);

          // Show toast notification
          toast({
            title: `New team message from ${newMessage.sender_name}`,
            description: newMessage.content.substring(0, 100) + (newMessage.content.length > 100 ? '...' : ''),
          });
        } else {
          console.log('Skipping notification sound - message is from current user');
        }
      })
      .subscribe();

    return () => {
      console.log('Cleaning up global chat notification listener');
      supabase.removeChannel(messagesSubscription);
    };
  }, [user]);

  return null;
};
