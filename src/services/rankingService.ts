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
    // Query orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('created_by, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('created_by', 'is', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    // Get unique user IDs
    const userIds = [...new Set(orders?.map(o => o.created_by).filter(Boolean))];

    // Fetch profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Create a map of user profiles
    const profileMap = new Map(
      profiles?.map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown User']) || []
    );

    // Group orders by user and count
    const userOrderCounts = new Map<string, { name: string; count: number }>();
    let totalOrders = 0;

    orders?.forEach((order: any) => {
      if (order.created_by) {
        const userId = order.created_by;
        const userName = profileMap.get(userId) || 'Unknown User';
        
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
