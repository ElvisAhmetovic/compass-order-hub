
import { useEffect, useRef } from 'react';

export const useNotificationSound = (shouldPlay: boolean) => {
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!shouldPlay) return;

    const playNotificationSound = () => {
      try {
        // Create audio context if it doesn't exist
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContext.current;
        
        // Create a simple notification beep
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Set frequency for a pleasant notification sound
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        
        // Set volume
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        // Play the sound
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    };

    playNotificationSound();
  }, [shouldPlay]);

  return null;
};
