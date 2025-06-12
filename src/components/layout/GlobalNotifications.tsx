
import { useGlobalChatNotifications } from '@/hooks/useGlobalChatNotifications';

const GlobalNotifications = () => {
  // This hook will run globally and handle chat notifications
  useGlobalChatNotifications();
  
  return null; // This component doesn't render anything
};

export default GlobalNotifications;
