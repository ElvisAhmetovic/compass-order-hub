
import { useEffect, useRef, useCallback } from 'react';

export const useNotificationSound = (shouldPlay: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize audio context on first user interaction
  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      isInitializedRef.current = true;
      console.log('Audio context initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }, []);

  // Set up click listener to initialize audio on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      // Close AudioContext to free resources
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => {
          console.warn('Error closing AudioContext:', err);
        });
        audioContextRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [initializeAudio]);

  useEffect(() => {
    if (!shouldPlay || !isInitializedRef.current || !audioContextRef.current) {
      if (shouldPlay && !isInitializedRef.current) {
        console.warn('Cannot play sound: Audio context not initialized. User interaction required.');
      }
      return;
    }

    const playNotificationSound = async () => {
      try {
        const ctx = audioContextRef.current!;
        
        // Make sure context is running
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        
        console.log('Playing notification sound...');
        
        // Create a more distinctive double beep
        const oscillator1 = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const gainNode1 = ctx.createGain();
        const gainNode2 = ctx.createGain();
        
        // Connect first beep
        oscillator1.connect(gainNode1);
        gainNode1.connect(ctx.destination);
        
        // Connect second beep
        oscillator2.connect(gainNode2);
        gainNode2.connect(ctx.destination);
        
        // Configure first beep (higher pitch)
        oscillator1.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator1.type = 'sine';
        gainNode1.gain.setValueAtTime(0, ctx.currentTime);
        gainNode1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        // Configure second beep (lower pitch, delayed)
        oscillator2.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.25);
        gainNode2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.26);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        
        // Play both beeps
        oscillator1.start(ctx.currentTime);
        oscillator1.stop(ctx.currentTime + 0.2);
        
        oscillator2.start(ctx.currentTime + 0.25);
        oscillator2.stop(ctx.currentTime + 0.45);
        
        console.log('Notification sound played successfully');
      } catch (error) {
        console.error('Error playing notification sound:', error);
        
        // Fallback: try simple beep
        try {
          console.log('Trying fallback beep...');
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.3);
          
          console.log('Fallback sound played');
        } catch (fallbackError) {
          console.error('Fallback sound also failed:', fallbackError);
        }
      }
    };

    playNotificationSound();
  }, [shouldPlay]);

  return null;
};
