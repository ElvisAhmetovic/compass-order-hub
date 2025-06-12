
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Enhanced global audio context management with better error handling
let globalAudioContext: AudioContext | null = null;
let isAudioInitialized = false;
let audioInitPromise: Promise<AudioContext | null> | null = null;

const initializeAudioContext = async (): Promise<AudioContext | null> => {
  // Return existing promise if initialization is in progress
  if (audioInitPromise) return audioInitPromise;
  
  if (isAudioInitialized && globalAudioContext) return globalAudioContext;
  
  audioInitPromise = (async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('⚠️ AudioContext not supported in this browser');
        return null;
      }

      globalAudioContext = new AudioContextClass();
      
      // Resume context if suspended
      if (globalAudioContext.state === 'suspended') {
        await globalAudioContext.resume();
        console.log('🔊 Audio context resumed from suspended state');
      }
      
      isAudioInitialized = true;
      console.log('🔊 Audio context initialized successfully:', globalAudioContext.state);
      return globalAudioContext;
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
      globalAudioContext = null;
      isAudioInitialized = false;
      return null;
    } finally {
      audioInitPromise = null;
    }
  })();
  
  return audioInitPromise;
};

// Enhanced user interaction setup with multiple event types
const setupAudioOnInteraction = () => {
  let isHandlerActive = true;

  const handleInteraction = async (event: Event) => {
    if (!isHandlerActive) return;
    
    console.log('🖱️ User interaction detected:', event.type);
    const context = await initializeAudioContext();
    
    if (context && isHandlerActive) {
      // Test audio capability immediately
      try {
        const testOscillator = context.createOscillator();
        const testGain = context.createGain();
        testOscillator.connect(testGain);
        testGain.connect(context.destination);
        testGain.gain.value = 0; // Silent test
        testOscillator.start();
        testOscillator.stop(context.currentTime + 0.001);
        console.log('✅ Audio test successful after user interaction');
      } catch (error) {
        console.warn('⚠️ Audio test failed:', error);
      }
      
      // Remove all listeners after successful initialization
      isHandlerActive = false;
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
    }
  };

  // Add multiple event listeners to catch various user interactions
  document.addEventListener('click', handleInteraction, { once: false });
  document.addEventListener('keydown', handleInteraction, { once: false });
  document.addEventListener('touchstart', handleInteraction, { once: false });
  document.addEventListener('mousedown', handleInteraction, { once: false });
  document.addEventListener('scroll', handleInteraction, { once: false, passive: true });
};

// Initialize immediately when module loads (browser environment)
if (typeof window !== 'undefined') {
  setupAudioOnInteraction();
}

const playNotificationSound = async (): Promise<boolean> => {
  try {
    console.log('🔊 SOUND TRIGGER: Starting enhanced notification sound');
    
    const audioContext = await initializeAudioContext();
    if (!audioContext) {
      console.warn('⚠️ Audio context not available, trying fallback');
      return tryFallbackSound();
    }

    // Ensure context is running
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('🔊 Resumed suspended audio context');
    }

    if (audioContext.state !== 'running') {
      console.warn('⚠️ Audio context not in running state:', audioContext.state);
      return tryFallbackSound();
    }

    // Create enhanced notification sound with better parameters
    const createBeep = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      // Enhanced volume envelope for smoother sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
      gainNode.gain.setValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
      
      return { oscillator, gainNode };
    };

    const currentTime = audioContext.currentTime;
    
    // Create pleasant double beep notification
    createBeep(880, currentTime + 0.05, 0.15, 0.25);      // First beep (higher pitch)
    createBeep(660, currentTime + 0.25, 0.15, 0.25);      // Second beep (lower pitch)
    
    console.log('✅ SOUND SUCCESS: Enhanced notification sound played');
    return true;
    
  } catch (error) {
    console.error('❌ SOUND ERROR:', error);
    return tryFallbackSound();
  }
};

// Improved fallback sound function
const tryFallbackSound = async (): Promise<boolean> => {
  try {
    console.log('🔄 Attempting fallback sound method');
    
    // Try creating a new temporary context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return false;
    
    const tempContext = new AudioContextClass();
    
    if (tempContext.state === 'suspended') {
      await tempContext.resume();
    }
    
    const oscillator = tempContext.createOscillator();
    const gainNode = tempContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(tempContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.2;
    
    oscillator.start();
    oscillator.stop(tempContext.currentTime + 0.3);
    
    // Clean up temporary context after a short delay
    setTimeout(() => {
      tempContext.close().catch(console.warn);
    }, 1000);
    
    console.log('✅ SOUND FALLBACK: Simple beep played successfully');
    return true;
    
  } catch (fallbackError) {
    console.error('❌ SOUND FALLBACK FAILED:', fallbackError);
    return false;
  }
};

export const useGlobalChatNotifications = () => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('🔔 GLOBAL CHAT: No user found, skipping notification setup');
      setIsConnected(false);
      return;
    }

    console.log('🔔 GLOBAL CHAT: Setting up enhanced global notification listener for user:', user.id);

    // Clean up existing subscription
    if (subscriptionRef.current) {
      console.log('🧹 GLOBAL CHAT: Cleaning up existing subscription');
      supabase.removeChannel(subscriptionRef.current);
    }

    // Create unique channel name with timestamp to avoid conflicts
    const channelName = `global-team-messages-v3-${user.id.slice(-8)}-${Date.now()}`;
    console.log('🔔 GLOBAL CHAT: Creating enhanced subscription channel:', channelName);
    
    const messagesSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const newMessage = payload.new as any;
        
        // Prevent duplicate processing
        if (lastMessageId === newMessage.id) {
          console.log('⏭️ GLOBAL CHAT: Duplicate message detected, skipping');
          return;
        }
        
        setLastMessageId(newMessage.id);
        
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
          
          // Play sound with enhanced error handling
          const soundPlayed = await playNotificationSound();
          console.log('🔊 Sound notification result:', soundPlayed ? 'Success' : 'Failed');
          
          // Show toast notification with better formatting
          toast({
            title: `💬 ${newMessage.sender_name}`,
            description: newMessage.content ? 
              (newMessage.content.length > 100 ? 
                newMessage.content.substring(0, 100) + '...' : 
                newMessage.content
              ) : 'New message received',
            duration: 4000,
          });

        } else {
          console.log('⏭️ GLOBAL CHAT: Skipping notification - message from current user');
        }
      })
      .subscribe((status) => {
        console.log('🔔 GLOBAL CHAT: Enhanced subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ GLOBAL CHAT: Successfully subscribed to enhanced global notifications');
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
      console.log('🧹 GLOBAL CHAT: Cleaning up enhanced subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setIsConnected(false);
      setLastMessageId(null);
    };
  }, [user]);

  return {
    isConnected,
    userId: user?.id,
    playTestSound: () => playNotificationSound()
  };
};

export { playNotificationSound };
