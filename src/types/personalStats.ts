export interface PersonalStats {
  userId: string;
  userName: string;
  personalBestDay: number;
  personalBestDate: string | null;
  currentStreak: number;
  longestStreak: number;
  currentRank: number;
  previousRank: number | null;
  rankChange: 'up' | 'down' | 'stable' | 'new';
  totalOrders: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  growthPercentage: number; // vs previous period
  nextMilestone: {
    count: number;
    remaining: number;
    achievementName: string;
    achievementIcon: string;
  } | null;
  totalPoints: number;
}
