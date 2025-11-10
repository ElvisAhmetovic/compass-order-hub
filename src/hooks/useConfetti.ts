import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const triggerConfetti = useCallback((options?: {
    origin?: { x: number; y: number };
    colors?: string[];
  }) => {
    const defaults = {
      particleCount: 100,
      spread: 70,
      origin: options?.origin || { y: 0.6 },
      colors: options?.colors || ['#FFD700', '#FFA500', '#FFED4E'],
    };

    confetti(defaults);
  }, []);

  return { triggerConfetti };
};
