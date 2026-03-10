import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const SIDEBAR_CONFIG_EVENT = 'sidebar-config-changed';

function getStorageKey(userId: string) {
  return `sidebar-hidden-items-${userId}`;
}

export function useSidebarConfig() {
  const { user } = useAuth();
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);

  const loadHiddenItems = useCallback(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(getStorageKey(user.id));
      setHiddenItems(stored ? JSON.parse(stored) : []);
    } catch {
      setHiddenItems([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHiddenItems();

    const handler = () => loadHiddenItems();
    window.addEventListener(SIDEBAR_CONFIG_EVENT, handler);
    return () => window.removeEventListener(SIDEBAR_CONFIG_EVENT, handler);
  }, [loadHiddenItems]);

  const toggleItem = useCallback((label: string) => {
    if (!user?.id) return;
    setHiddenItems(prev => {
      const next = prev.includes(label)
        ? prev.filter(i => i !== label)
        : [...prev, label];
      localStorage.setItem(getStorageKey(user.id), JSON.stringify(next));
      window.dispatchEvent(new Event(SIDEBAR_CONFIG_EVENT));
      return next;
    });
  }, [user?.id]);

  const isHidden = useCallback((label: string) => hiddenItems.includes(label), [hiddenItems]);

  return { hiddenItems, toggleItem, isHidden };
}
