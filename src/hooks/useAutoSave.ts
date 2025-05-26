
import { useEffect, useRef, useCallback } from 'react';
import { BackgroundTemplate } from '@/services/templateService';

interface UseAutoSaveProps {
  template: BackgroundTemplate;
  onSave: (template: BackgroundTemplate) => Promise<void>;
  delay?: number;
}

export const useAutoSave = ({ template, onSave, delay = 2000 }: UseAutoSaveProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  const triggerAutoSave = useCallback(async () => {
    const currentState = JSON.stringify(template);
    
    // Only save if there are actual changes
    if (currentState !== lastSavedRef.current && template.name) {
      try {
        await onSave(template);
        lastSavedRef.current = currentState;
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [template, onSave]);

  const scheduleAutoSave = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new auto-save
    timeoutRef.current = setTimeout(triggerAutoSave, delay);
  }, [triggerAutoSave, delay]);

  useEffect(() => {
    // Schedule auto-save when template changes
    scheduleAutoSave();

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [template, scheduleAutoSave]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};
