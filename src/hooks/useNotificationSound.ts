
import { useEffect, useRef } from 'react';

export const useNotificationSound = (shouldPlay: boolean) => {
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!shouldPlay) return;

    const playNotificationSound = async () => {
      try {
        // Create audio context if it doesn't exist
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContext.current;
        
        // Resume context if suspended (required by some browsers)
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        
        // Create a simple notification beep
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Set frequency for a pleasant notification sound (two beeps)
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
        
        // Set volume envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        // Play the sound
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        
        console.log('Notification sound played');
      } catch (error) {
        console.warn('Could not play notification sound:', error);
        
        // Fallback: try to play a simple beep using the older Web Audio API
        try {
          const beep = () => {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
          };
          
          beep();
          console.log('Fallback notification sound played');
        } catch (fallbackError) {
          console.warn('Fallback sound also failed:', fallbackError);
        }
      }
    };

    playNotificationSound();
  }, [shouldPlay]);

  return null;
};
