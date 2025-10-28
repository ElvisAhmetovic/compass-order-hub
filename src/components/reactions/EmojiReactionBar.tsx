import { useEffect, useState, useMemo, useCallback } from "react";
import { ReactionService } from "@/services/reactionService";
import { Reaction, ReactionGroup, AVAILABLE_EMOJIS } from "@/types/reactions";
import { ReactionButton } from "./ReactionButton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmojiReactionBarProps {
  entityType: 'order' | 'ticket';
  entityId: string;
  className?: string;
}

export const EmojiReactionBar = ({
  entityType,
  entityId,
  className = "",
}: EmojiReactionBarProps) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  // Fetch reactions on mount
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const data = await ReactionService.getReactions(entityType, entityId);
        setReactions(data);
      } catch (error) {
        console.error('Error fetching reactions:', error);
      }
    };

    fetchReactions();
  }, [entityType, entityId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = ReactionService.subscribeToReactions(
      entityType,
      entityId,
      (updatedReactions) => {
        setReactions(updatedReactions);
      }
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId]);

  // Group reactions by emoji
  const groupedReactions = useMemo((): ReactionGroup[] => {
    const groups = AVAILABLE_EMOJIS.map(emoji => {
      const emojiReactions = reactions.filter(r => r.emoji === emoji);
      return {
        emoji,
        count: emojiReactions.length,
        users: emojiReactions.map(r => ({ id: r.user_id, name: r.user_name })),
        hasUserReacted: emojiReactions.some(r => r.user_id === user?.id),
      };
    });
    return groups;
  }, [reactions, user?.id]);

  const handleReactionClick = useCallback(async (emoji: string) => {
    if (!user) {
      toast.error("Please log in to react");
      return;
    }

    setLoading(emoji);

    try {
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';
      await ReactionService.toggleReaction(entityType, entityId, emoji, userName);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error("Failed to update reaction");
    } finally {
      setLoading(null);
    }
  }, [entityType, entityId, user]);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {groupedReactions.map((group) => (
        <ReactionButton
          key={group.emoji}
          emoji={group.emoji}
          count={group.count}
          hasUserReacted={group.hasUserReacted}
          users={group.users}
          onClick={() => handleReactionClick(group.emoji)}
          disabled={loading === group.emoji}
        />
      ))}
    </div>
  );
};
