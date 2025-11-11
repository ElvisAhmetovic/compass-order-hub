export type ChallengePeriod = 'daily' | 'weekly' | 'monthly';

export interface TeamChallenge {
  id: string;
  name: string;
  description: string;
  target: number;
  period: ChallengePeriod;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_completed: boolean;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeProgress {
  challenge: TeamChallenge;
  current: number;
  percentage: number;
  remaining: number;
  daysRemaining: number;
  isCompleted: boolean;
}
