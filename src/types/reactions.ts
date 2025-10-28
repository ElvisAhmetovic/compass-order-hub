export interface Reaction {
  id: string;
  entity_type: 'order' | 'ticket';
  entity_id: string;
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
  hasUserReacted: boolean;
}

export const AVAILABLE_EMOJIS = [
  '❤️', '👍', '👎', '👀', '🔥', '❗', '✅', '❌', 
  '💬', '⏰', '🎯', '💡', '🤔', '👏', '⚠️', '📌'
] as const;
export type AvailableEmoji = typeof AVAILABLE_EMOJIS[number];
