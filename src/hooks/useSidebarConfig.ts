import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSidebarConfig() {
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [configId, setConfigId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('sidebar_config')
        .select('id, hidden_items')
        .limit(1)
        .single();

      if (!error && data) {
        setConfigId(data.id);
        setHiddenItems((data.hidden_items as string[]) ?? []);
      }
    };

    fetchConfig();

    const channel = supabase
      .channel('sidebar-config-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sidebar_config',
      }, (payload) => {
        const newItems = (payload.new as any).hidden_items as string[];
        setHiddenItems(newItems ?? []);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const toggleItem = useCallback(async (label: string) => {
    if (!configId) return;
    const next = hiddenItems.includes(label)
      ? hiddenItems.filter(i => i !== label)
      : [...hiddenItems, label];

    setHiddenItems(next);

    await supabase
      .from('sidebar_config')
      .update({ hidden_items: next, updated_at: new Date().toISOString() })
      .eq('id', configId);
  }, [configId, hiddenItems]);

  const isHidden = useCallback((label: string) => hiddenItems.includes(label), [hiddenItems]);

  return { hiddenItems, toggleItem, isHidden };
}
