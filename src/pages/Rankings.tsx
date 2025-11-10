import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import { PeriodFilter } from '@/components/rankings/PeriodFilter';
import { RankingCard } from '@/components/rankings/RankingCard';
import { StatsSummary } from '@/components/rankings/StatsSummary';
import { getRankingsByPeriod } from '@/services/rankingService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Rankings = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['rankings', selectedPeriod],
    queryFn: () => getRankingsByPeriod(selectedPeriod),
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  const rankings = data?.rankings || [];
  const summary = data?.summary || {
    totalOrders: 0,
    totalUsers: 0,
    averageOrdersPerUser: 0,
    topPerformer: 'N/A',
    topPerformerCount: 0,
  };

  const maxCount = rankings[0]?.orderCount || 1;

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All Time';
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout>
          <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Team Rankings</h1>
              <p className="text-muted-foreground">
                Track your team's performance and order creation
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Period Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Time Period</CardTitle>
            <CardDescription>
              View rankings for different time periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PeriodFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <StatsSummary summary={summary} isLoading={isLoading} />

        {/* Rankings List */}
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard - {getPeriodLabel()}</CardTitle>
            <CardDescription>
              {!isLoading && rankings.length > 0 && (
                <span className="text-xs">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-32"></div>
                          <div className="h-3 bg-muted rounded w-24"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
                <p className="text-muted-foreground">
                  No orders have been created in this period.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rankings.map((ranking) => (
                  <RankingCard
                    key={ranking.userId}
                    ranking={ranking}
                    maxCount={maxCount}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </Layout>
      </div>
    </div>
  );
};

export default Rankings;
