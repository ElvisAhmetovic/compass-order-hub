import { supabase } from '@/integrations/supabase/client';

export interface RankingData {
  rank: number;
  userId: string;
  userName: string;
  orderCount: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface UserStats {
  totalOrders: number;
  rank: number;
  percentageOfTotal: number;
}

export interface RankingsSummary {
  totalOrders: number;
  totalUsers: number;
  averageOrdersPerUser: number;
  topPerformer: string;
  topPerformerCount: number;
}

export const getRankingsByPeriod = async (
  period: 'today' | 'week' | 'month' | 'all'
): Promise<{ rankings: RankingData[]; summary: RankingsSummary }> => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
  }

  return getRankingsByDateRange(startDate, now);
};

export const getRankingsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<{ rankings: RankingData[]; summary: RankingsSummary }> => {
  try {
    // Query orders with profile information
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_by, created_at, profiles(first_name, last_name)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('created_by', 'is', null);

    if (error) {
      console.error('Error fetching rankings:', error);
      throw error;
    }

    // Group orders by user and count
    const userOrderCounts = new Map<string, { name: string; count: number }>();
    let totalOrders = 0;

    orders?.forEach((order: any) => {
      if (order.created_by && order.profiles) {
        const userId = order.created_by;
        const userName = `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Unknown User';
        
        if (userOrderCounts.has(userId)) {
          userOrderCounts.get(userId)!.count++;
        } else {
          userOrderCounts.set(userId, { name: userName, count: 1 });
        }
        totalOrders++;
      }
    });

    // Convert to array and sort by count
    const sortedRankings = Array.from(userOrderCounts.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        orderCount: data.count,
        percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    // Calculate summary statistics
    const summary: RankingsSummary = {
      totalOrders,
      totalUsers: sortedRankings.length,
      averageOrdersPerUser: sortedRankings.length > 0 ? totalOrders / sortedRankings.length : 0,
      topPerformer: sortedRankings[0]?.userName || 'N/A',
      topPerformerCount: sortedRankings[0]?.orderCount || 0,
    };

    return { rankings: sortedRankings, summary };
  } catch (error) {
    console.error('Error in getRankingsByDateRange:', error);
    throw error;
  }
};

export const getUserStats = async (
  userId: string,
  period: 'today' | 'week' | 'month' | 'all'
): Promise<UserStats> => {
  const { rankings } = await getRankingsByPeriod(period);
  
  const userRanking = rankings.find(r => r.userId === userId);
  
  return {
    totalOrders: userRanking?.orderCount || 0,
    rank: userRanking?.rank || rankings.length + 1,
    percentageOfTotal: userRanking?.percentage || 0,
  };
};
