export type AchievementCategory = 'milestone' | 'streak' | 'speed' | 'consistency' | 'rank';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface AchievementCriteria {
  type: 'order_count' | 'streak' | 'daily_orders' | 'rank';
  value: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  criteria: AchievementCriteria;
  tier: AchievementTier;
  points: number;
  created_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  achievement?: AchievementDefinition;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_order_date: string | null;
  streak_freezes_used: number;
  created_at: string;
  updated_at: string;
}

export interface AchievementProgress {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
  progress: number;
  unlockedAt?: string;
}
