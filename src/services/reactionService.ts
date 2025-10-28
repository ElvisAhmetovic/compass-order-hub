import { supabase } from "@/integrations/supabase/client";
import { Reaction } from "@/types/reactions";

export class ReactionService {
  static async getReactions(
    entityType: 'order' | 'ticket',
    entityId: string
  ): Promise<Reaction[]> {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching reactions:', error);
      throw error;
    }

    return data || [];
  }

  static async addReaction(
    entityType: 'order' | 'ticket',
    entityId: string,
    emoji: string,
    userName: string
  ): Promise<Reaction> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reactions')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
        user_name: userName,
        emoji,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }

    return data;
  }

  static async removeReaction(
    entityType: 'order' | 'ticket',
    entityId: string,
    emoji: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  static async toggleReaction(
    entityType: 'order' | 'ticket',
    entityId: string,
    emoji: string,
    userName: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if reaction exists
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      await this.removeReaction(entityType, entityId, emoji);
    } else {
      await this.addReaction(entityType, entityId, emoji, userName);
    }
  }

  static subscribeToReactions(
    entityType: 'order' | 'ticket',
    entityId: string,
    callback: (reactions: Reaction[]) => void
  ) {
    const channel = supabase
      .channel(`reactions-${entityType}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`
        },
        async () => {
          // Fetch updated reactions when any change occurs
          const reactions = await this.getReactions(entityType, entityId);
          callback(reactions);
        }
      )
      .subscribe();

    return channel;
  }
}
