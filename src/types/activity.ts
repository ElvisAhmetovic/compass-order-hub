export type ActivityType = 
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'rank_change'
  | 'milestone_reached'
  | 'order_created';

export interface ActivityData {
  achievementName?: string;
  achievementIcon?: string;
  achievementTier?: string;
  streakCount?: number;
  oldRank?: number;
  newRank?: number;
  milestoneCount?: number;
  orderCount?: number;
  [key: string]: any;
}

export interface TeamActivity {
  id: string;
  user_id: string;
  user_name: string;
  activity_type: ActivityType;
  data: ActivityData;
  created_at: string;
}
