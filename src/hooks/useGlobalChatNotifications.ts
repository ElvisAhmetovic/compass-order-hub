
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Enhanced global audio context management
let globalAudioContext: AudioContext | null = null;
let isAudioInitialized = false;

const initializeAudioContext = async () => {
  if (isAudioInitialized && globalAudioContext) return globalAudioContext;
  
  try {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume context if suspended
    if (globalAudioContext.state === 'suspended') {
      await globalAudioContext.resume();
      console.log('🔊 Audio context resumed');
    }
    
    isAudioInitialized = true;
    console.log('🔊 Audio context initialized successfully');
    return globalAudioContext;
  } catch (error) {
    console.error('❌ Failed to initialize audio context:', error);
    return null;
  }
};

// Initialize on user interaction
const setupAudioOnInteraction = () => {
  const handleInteraction = async () => {
    await initializeAudioContext();
    // Remove listeners after first interaction
    document.removeEventListener('click', handleInteraction);
    document.removeEventListener('keydown', handleInteraction);
    document.removeEventListener('touchstart', handleInteraction);
  };

  document.addEventListener('click', handleInteraction);
  document.addEventListener('keydown', handleInteraction);
  document.addEventListener('touchstart', handleInteraction);
};

// Initialize immediately
if (typeof window !== 'undefined') {
  setupAudioOnInteraction();
}

const playNotificationSound = async () => {
  try {
    console.log('🔊 SOUND TRIGGER: Starting notification sound');
    
    const audioContext = await initializeAudioContext();
    if (!audioContext) {
      console.warn('⚠️ Audio context not available');
      return;
    }

    // Create enhanced notification sound (double beep)
    const createBeep = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
      
      return oscillator;
    };

    const currentTime = audioContext.currentTime;
    
    // Create double beep notification
    createBeep(800, currentTime, 0.15);        // First beep (higher)
    createBeep(600, currentTime + 0.2, 0.15);  // Second beep (lower)
    
    console.log('✅ SOUND SUCCESS: Notification sound played');
  } catch (error) {
    console.error('❌ SOUND ERROR:', error);
    
    // Fallback with simpler approach
    try {
      const fallbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = fallbackContext.createOscillator();
      const gainNode = fallbackContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(fallbackContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2;
      
      oscillator.start();
      oscillator.stop(fallbackContext.currentTime + 0.3);
      
      console.log('✅ SOUND FALLBACK: Simple beep played');
    } catch (fallbackError) {
      console.error('❌ SOUND FALLBACK FAILED:', fallbackError);
    }
  }
};

export const useGlobalChatNotifications = () => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log('🔔 GLOBAL CHAT: No user found, skipping setup');
      setIsConnected(false);
      return;
    }

    console.log('🔔 GLOBAL CHAT: Setting up global notification listener for user:', user.id);

    // Clean up existing subscription
    if (subscriptionRef.current) {
      console.log('🧹 GLOBAL CHAT: Cleaning up existing subscription');
      supabase.removeChannel(subscriptionRef.current);
    }

    // Subscribe to ALL new messages with enhanced channel name
    const channelName = `global-team-messages-enhanced-v2-${Date.now()}`;
    console.log('🔔 GLOBAL CHAT: Creating subscription channel:', channelName);
    
    const messagesSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        
        console.log('🔔 GLOBAL CHAT: New message detected!', {
          messageId: newMessage.id,
          senderId: newMessage.sender_id,
          senderName: newMessage.sender_name,
          currentUserId: user.id,
          content: newMessage.content?.substring(0, 50) + (newMessage.content?.length > 50 ? '...' : ''),
          channelId: newMessage.channel_id,
          timestamp: new Date().toISOString()
        });

        // Only process messages from OTHER users
        if (newMessage.sender_id !== user.id) {
          console.log('🔊 GLOBAL CHAT: Processing notification for message from:', newMessage.sender_name);
          
          // Play sound immediately
          playNotificationSound();
          
          // Show toast notification
          toast({
            title: `💬 ${newMessage.sender_name}`,
            description: newMessage.content ? 
              (newMessage.content.length > 80 ? 
                newMessage.content.substring(0, 80) + '...' : 
                newMessage.content
              ) : 'New message',
            duration: 5000,
          });

        } else {
          console.log('⏭️ GLOBAL CHAT: Skipping notification - message from current user');
        }
      })
      .subscribe((status) => {
        console.log('🔔 GLOBAL CHAT: Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ GLOBAL CHAT: Successfully subscribed to global notifications');
          setIsConnected(true);
        } else if (status === 'CLOSED') {
          console.log('❌ GLOBAL CHAT: Subscription closed');
          setIsConnected(false);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ GLOBAL CHAT: Subscription error');
          setIsConnected(false);
        }
      });

    subscriptionRef.current = messagesSubscription;

    return () => {
      console.log('🧹 GLOBAL CHAT: Cleaning up subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user]);

  return {
    isConnected,
    userId: user?.id,
    playTestSound: playNotificationSound
  };
};

export { playNotificationSound };
