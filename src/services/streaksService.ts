import { supabase } from '@/integrations/supabase/client';
import { UserStreak } from '@/types/achievements';

export const streaksService = {
  async getUserStreak(userId: string): Promise<UserStreak> {
    let { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      const { data: newStreak, error: insertError } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_order_date: null,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return newStreak!;
    }
    
    if (error) throw error;
    return data!;
  },

  async updateStreakOnOrder(userId: string): Promise<UserStreak> {
    const streak = await this.getUserStreak(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastOrderDate = streak.last_order_date;
    
    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;
    
    if (lastOrderDate) {
      const lastDate = new Date(lastOrderDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return streak;
      } else if (diffDays === 1) {
        newCurrentStreak = streak.current_streak + 1;
      } else {
        newCurrentStreak = 1;
      }
    } else {
      newCurrentStreak = 1;
    }
    
    newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
    
    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_order_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data!;
  },

  async getAllStreaks(): Promise<UserStreak[]> {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .order('current_streak', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async checkAndResetExpiredStreaks(): Promise<void> {
    const { data: allStreaks } = await supabase
      .from('user_streaks')
      .select('*')
      .gt('current_streak', 0);
    
    if (!allStreaks) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const streak of allStreaks) {
      if (streak.last_order_date) {
        const lastDate = new Date(streak.last_order_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          await supabase
            .from('user_streaks')
            .update({
              current_streak: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', streak.user_id);
        }
      }
    }
  },
};
