
import { useEffect } from 'react';
import { useGlobalChatNotifications } from '@/hooks/useGlobalChatNotifications';

const GlobalNotifications = () => {
  useGlobalChatNotifications();

  // Fix for Radix UI TooltipProvider stuck pointer-transit state after tab switch
  useEffect(() => {
    const resetRadixState = () => {
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true })
      );
      document.body.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true })
      );
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resetRadixState();
      }
    };

    const handleBlur = () => resetRadixState();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', resetRadixState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', resetRadixState);
    };
  }, []);

  return null;
};

export default GlobalNotifications;
