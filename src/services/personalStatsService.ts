import { supabase } from '@/integrations/supabase/client';
import { PersonalStats } from '@/types/personalStats';
import { achievementsService } from './achievementsService';
import { streaksService } from './streaksService';

export const personalStatsService = {
  async getPersonalStats(userId: string): Promise<PersonalStats | null> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const userName = profile 
        ? `${profile.first_name} ${profile.last_name}`.trim() 
        : 'User';

      // Get all user orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('created_at, created_by')
        .eq('created_by', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      const totalOrders = allOrders?.length || 0;

      // Calculate personal best day
      const ordersByDate = new Map<string, number>();
      allOrders?.forEach(order => {
        const date = order.created_at.split('T')[0];
        ordersByDate.set(date, (ordersByDate.get(date) || 0) + 1);
      });

      let personalBestDay = 0;
      let personalBestDate: string | null = null;
      ordersByDate.forEach((count, date) => {
        if (count > personalBestDay) {
          personalBestDay = count;
          personalBestDate = date;
        }
      });

      // Get today's orders
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersByDate.get(today) || 0;

      // Get week orders
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekOrders = allOrders?.filter(
        o => new Date(o.created_at) >= weekAgo
      ).length || 0;

      // Get month orders
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthOrders = allOrders?.filter(
        o => new Date(o.created_at) >= monthAgo
      ).length || 0;

      // Calculate growth percentage (month vs previous month)
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      const previousMonthOrders = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= twoMonthsAgo && orderDate < monthAgo;
      }).length || 0;

      const growthPercentage = previousMonthOrders > 0
        ? Math.round(((monthOrders - previousMonthOrders) / previousMonthOrders) * 100)
        : monthOrders > 0 ? 100 : 0;

      // Get streak data
      const streak = await streaksService.getUserStreak(userId);

      // Get current rank
      const { data: allUsersOrders } = await supabase
        .from('orders')
        .select('created_by')
        .is('deleted_at', null);

      const userCounts = new Map<string, number>();
      allUsersOrders?.forEach(order => {
        if (order.created_by) {
          userCounts.set(order.created_by, (userCounts.get(order.created_by) || 0) + 1);
        }
      });

      const sortedUsers = Array.from(userCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const currentRank = sortedUsers.findIndex(([id]) => id === userId) + 1;

      // TODO: Store rank history in a separate table for tracking changes
      const previousRank = null;
      const rankChange: 'up' | 'down' | 'stable' | 'new' = 
        previousRank === null ? 'new' :
        previousRank > currentRank ? 'up' :
        previousRank < currentRank ? 'down' : 'stable';

      // Get next milestone achievement
      const progress = await achievementsService.getAchievementProgress(userId);
      const nextMilestone = progress
        .filter(p => !p.isUnlocked && p.achievement.criteria.type === 'order_count')
        .sort((a, b) => a.achievement.criteria.value - b.achievement.criteria.value)[0];

      let nextMilestoneData = null;
      if (nextMilestone) {
        nextMilestoneData = {
          count: nextMilestone.achievement.criteria.value,
          remaining: nextMilestone.achievement.criteria.value - totalOrders,
          achievementName: nextMilestone.achievement.name,
          achievementIcon: nextMilestone.achievement.icon,
        };
      }

      // Get total achievement points
      const totalPoints = await achievementsService.getUserPoints(userId);

      return {
        userId,
        userName,
        personalBestDay,
        personalBestDate,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        currentRank,
        previousRank,
        rankChange,
        totalOrders,
        todayOrders,
        weekOrders,
        monthOrders,
        growthPercentage,
        nextMilestone: nextMilestoneData,
        totalPoints,
      };
    } catch (error) {
      console.error('Error fetching personal stats:', error);
      return null;
    }
  },
};
