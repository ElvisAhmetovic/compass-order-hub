import { supabase } from '@/integrations/supabase/client';
import { TeamActivity, ActivityType, ActivityData } from '@/types/activity';

export const activityService = {
  async logActivity(
    userId: string,
    userName: string,
    activityType: ActivityType,
    data: ActivityData
  ): Promise<TeamActivity | null> {
    try {
      const { data: activity, error } = await supabase
        .from('team_activities')
        .insert({
          user_id: userId,
          user_name: userName,
          activity_type: activityType,
          data,
        })
        .select()
        .single();

      if (error) throw error;
      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  },

  async getRecentActivities(limit: number = 20): Promise<TeamActivity[]> {
    try {
      const { data, error } = await supabase
        .from('team_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  },

  subscribeToActivities(
    onActivity: (activity: TeamActivity) => void
  ): () => void {
    const channel = supabase
      .channel('team-activities-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_activities',
        },
        (payload) => {
          onActivity(payload.new as TeamActivity);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
