import { supabase } from '@/integrations/supabase/client';
import { TeamChallenge, ChallengeProgress, ChallengePeriod } from '@/types/challenges';

export const challengeService = {
  async getActiveChallenges(): Promise<TeamChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('team_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active challenges:', error);
      return [];
    }
  },

  async getChallengeProgress(challengeId: string): Promise<ChallengeProgress | null> {
    try {
      const { data: challenge, error: challengeError } = await supabase
        .from('team_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError || !challenge) throw challengeError;

      // Calculate current progress based on orders in the challenge period
      const { count: current } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', challenge.start_date)
        .lte('created_at', challenge.end_date + 'T23:59:59')
        .is('deleted_at', null);

      const currentCount = current || 0;
      const percentage = Math.min(100, Math.round((currentCount / challenge.target) * 100));
      const remaining = Math.max(0, challenge.target - currentCount);

      const endDate = new Date(challenge.end_date);
      const today = new Date();
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      // Check if challenge should be marked as completed
      if (currentCount >= challenge.target && !challenge.is_completed) {
        await supabase
          .from('team_challenges')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', challengeId);
      }

      return {
        challenge,
        current: currentCount,
        percentage,
        remaining,
        daysRemaining,
        isCompleted: currentCount >= challenge.target,
      };
    } catch (error) {
      console.error('Error fetching challenge progress:', error);
      return null;
    }
  },

  async getAllChallengeProgress(): Promise<ChallengeProgress[]> {
    const challenges = await this.getActiveChallenges();
    const progressPromises = challenges.map(challenge => 
      this.getChallengeProgress(challenge.id)
    );
    const results = await Promise.all(progressPromises);
    return results.filter((p): p is ChallengeProgress => p !== null);
  },

  async createChallenge(
    name: string,
    description: string,
    target: number,
    period: ChallengePeriod,
    startDate: Date,
    endDate: Date
  ): Promise<TeamChallenge | null> {
    try {
      const { data, error } = await supabase
        .from('team_challenges')
        .insert({
          name,
          description,
          target,
          period,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      return null;
    }
  },

  async getCompletedChallenges(limit: number = 10): Promise<TeamChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('team_challenges')
        .select('*')
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completed challenges:', error);
      return [];
    }
  },
};
