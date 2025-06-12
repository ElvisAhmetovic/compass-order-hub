
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Global audio context to avoid suspension issues
let globalAudioContext: AudioContext | null = null;

const initializeAudioContext = () => {
  if (!globalAudioContext) {
    try {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🔊 Global audio context initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
    }
  }
  return globalAudioContext;
};

// Initialize audio context on user interaction
const initializeAudioOnInteraction = () => {
  const handleInteraction = async () => {
    const audioContext = initializeAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log('🔊 Audio context resumed on user interaction');
      } catch (error) {
        console.error('❌ Failed to resume audio context:', error);
      }
    }
    // Remove listeners after first interaction
    document.removeEventListener('click', handleInteraction);
    document.removeEventListener('keydown', handleInteraction);
    document.removeEventListener('touchstart', handleInteraction);
  };

  document.addEventListener('click', handleInteraction, { once: true });
  document.addEventListener('keydown', handleInteraction, { once: true });
  document.addEventListener('touchstart', handleInteraction, { once: true });
};

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeAudioOnInteraction();
}

const playNotificationSound = async () => {
  try {
    const audioContext = initializeAudioContext();
    if (!audioContext) {
      console.warn('⚠️ Audio context not available');
      return;
    }

    // Resume context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('🔊 Audio context resumed for notification');
    }

    // Create and play notification beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound - pleasant notification beep
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Configure volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
    
    console.log('✅ Notification sound played successfully');
  } catch (error) {
    console.error('❌ Error playing notification sound:', error);
    
    // Fallback: try to create new context
    try {
      const fallbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = fallbackContext.createOscillator();
      const gainNode = fallbackContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(fallbackContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(fallbackContext.currentTime + 0.3);
      
      console.log('✅ Fallback notification sound played');
    } catch (fallbackError) {
      console.error('❌ Fallback sound also failed:', fallbackError);
    }
  }
};

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
      .channel('global-team-messages-v8') // Updated channel version
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

        // Only show notifications and play sound for messages from OTHER users
        if (newMessage.sender_id !== user.id) {
          console.log('🔊 PLAYING GLOBAL SOUND! Message from:', newMessage.sender_name, 'to user:', user.id);
          
          // Play sound immediately - no async wrapper to avoid delays
          playNotificationSound();
          
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
        supabase.removeChannel(subscriptionRef.current);
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
