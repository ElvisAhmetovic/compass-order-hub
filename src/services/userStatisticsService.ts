import { supabase } from "@/integrations/supabase/client";

export interface UserStatistics {
  userId: string;
  userName: string;
  email: string;
  role: string;
  lifetimeOrders: number;
  monthlyOrders: number;
  weeklyOrders: number;
  todayOrders: number;
  customPeriodOrders: number;
  lastOrderDate: string | null;
}

export const getUserStatistics = async (
  startDate?: Date,
  endDate?: Date
): Promise<UserStatistics[]> => {
  try {
    // Fetch all profiles with user data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .order('first_name', { ascending: true });

    if (profilesError) throw profilesError;

    // Get user emails from auth.users
    const userIds = profiles?.map(p => p.id) || [];
    
    // Fetch aggregated order statistics for all users
    const { data: orderStats, error: ordersError } = await supabase
      .from('orders')
      .select('created_by, created_at')
      .in('created_by', userIds)
      .is('deleted_at', null);

    if (ordersError) throw ordersError;

    // Calculate statistics for each user
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const customStart = startDate || null;
    const customEnd = endDate || null;

    const statistics: UserStatistics[] = await Promise.all(
      profiles?.map(async (profile) => {
        const userOrders = orderStats?.filter(o => o.created_by === profile.id) || [];
        
        const lifetimeOrders = userOrders.length;
        const monthlyOrders = userOrders.filter(o => new Date(o.created_at) >= startOfMonth).length;
        const weeklyOrders = userOrders.filter(o => new Date(o.created_at) >= startOfWeek).length;
        const todayOrders = userOrders.filter(o => new Date(o.created_at) >= startOfToday).length;
        
        const customPeriodOrders = customStart && customEnd
          ? userOrders.filter(o => {
              const orderDate = new Date(o.created_at);
              return orderDate >= customStart && orderDate <= customEnd;
            }).length
          : monthlyOrders;
        
        const lastOrder = userOrders.length > 0
          ? userOrders.reduce((latest, order) => 
              new Date(order.created_at) > new Date(latest.created_at) ? order : latest
            )
          : null;

        // Get email from auth.users
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
        const email = userData?.user?.email || '';

        return {
          userId: profile.id,
          userName: `${profile.first_name} ${profile.last_name}`.trim() || 'No Name',
          email,
          role: profile.role,
          lifetimeOrders,
          monthlyOrders,
          weeklyOrders,
          todayOrders,
          customPeriodOrders,
          lastOrderDate: lastOrder ? lastOrder.created_at : null,
        };
      }) || []
    );

    return statistics;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
};
