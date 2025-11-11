import { supabase } from '@/integrations/supabase/client';
import { AchievementDefinition, UserAchievement, AchievementProgress } from '@/types/achievements';

export const achievementsService = {
  async getAllDefinitions(): Promise<AchievementDefinition[]> {
    const { data, error } = await supabase
      .from('achievement_definitions')
      .select('*')
      .order('points', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievement_definitions(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const definitions = await this.getAllDefinitions();
    const unlocked = await this.getUserAchievements(userId);
    const unlockedIds = new Set(unlocked.map(a => a.achievement_id));
    const stats = await this.getUserStats(userId);
    
    return definitions.map(achievement => {
      const isUnlocked = unlockedIds.has(achievement.id);
      const unlockedAchievement = unlocked.find(a => a.achievement_id === achievement.id);
      
      let progress = 0;
      if (isUnlocked) {
        progress = 100;
      } else {
        switch (achievement.criteria.type) {
          case 'order_count':
            progress = Math.min(100, (stats.lifetimeOrders / achievement.criteria.value) * 100);
            break;
          case 'streak':
            progress = Math.min(100, (stats.currentStreak / achievement.criteria.value) * 100);
            break;
          case 'daily_orders':
            progress = Math.min(100, (stats.todayOrders / achievement.criteria.value) * 100);
            break;
          case 'rank':
            progress = stats.currentRank <= achievement.criteria.value ? 100 : 0;
            break;
        }
      }
      
      return {
        achievement,
        isUnlocked,
        progress: Math.round(progress),
        unlockedAt: unlockedAchievement?.unlocked_at,
      };
    });
  },

  async getUserStats(userId: string) {
    const { count: lifetimeOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .is('deleted_at', null);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .gte('created_at', today.toISOString())
      .is('deleted_at', null);
    
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single();
    
    const { data: allOrders } = await supabase
      .from('orders')
      .select('created_by')
      .is('deleted_at', null);
    
    const userCounts = new Map<string, number>();
    allOrders?.forEach(order => {
      if (order.created_by) {
        userCounts.set(order.created_by, (userCounts.get(order.created_by) || 0) + 1);
      }
    });
    
    const sortedUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    const currentRank = sortedUsers.findIndex(([id]) => id === userId) + 1;
    
    return {
      lifetimeOrders: lifetimeOrders || 0,
      todayOrders: todayOrders || 0,
      currentStreak: streakData?.current_streak || 0,
      currentRank,
    };
  },

  async checkAndUnlockAchievements(userId: string): Promise<UserAchievement[]> {
    const progress = await this.getAchievementProgress(userId);
    const newlyUnlocked: UserAchievement[] = [];
    
    for (const item of progress) {
      if (!item.isUnlocked && item.progress >= 100) {
        const { data, error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: item.achievement.id,
            progress: 100,
          })
          .select()
          .single();
        
        if (!error && data) {
          newlyUnlocked.push(data);
        }
      }
    }
    
    return newlyUnlocked;
  },

  async getUserPoints(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        achievement:achievement_definitions(points)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data?.reduce((sum, item: any) => {
      return sum + (item.achievement?.points || 0);
    }, 0) || 0;
  },
};
