import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { personalStatsService } from '@/services/personalStatsService';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  Calendar, 
  Target, 
  Flame,
  Trophy,
  Zap
} from 'lucide-react';

export const PersonalStats = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['personal-stats', user?.id],
    queryFn: () => user?.id ? personalStatsService.getPersonalStats(user.id) : null,
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getRankChangeIcon = () => {
    switch (stats.rankChange) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      case 'new':
        return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRankChangeText = () => {
    if (stats.previousRank === null) return 'New';
    const diff = stats.previousRank - stats.currentRank;
    if (diff > 0) return `↑ ${diff}`;
    if (diff < 0) return `↓ ${Math.abs(diff)}`;
    return '—';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Your Performance
        </CardTitle>
        <CardDescription>Personal stats and progress tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rank */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Current Rank</p>
              <p className="text-xs text-muted-foreground">Your position</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg font-bold px-3 py-1">
              #{stats.currentRank}
            </Badge>
            <div className="flex items-center gap-1">
              {getRankChangeIcon()}
              <span className="text-xs font-medium">{getRankChangeText()}</span>
            </div>
          </div>
        </div>

        {/* Personal Best Day */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/20">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Personal Best</p>
              <p className="text-xs text-muted-foreground">
                {stats.personalBestDate 
                  ? new Date(stats.personalBestDate).toLocaleDateString()
                  : 'No data'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{stats.personalBestDay}</p>
            <p className="text-xs text-muted-foreground">orders</p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
              <Flame className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Current Streak</p>
              <p className="text-xs text-muted-foreground">
                Best: {stats.longestStreak} days
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
        </div>

        {/* Growth Percentage */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${stats.growthPercentage >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {stats.growthPercentage >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Monthly Growth</p>
              <p className="text-xs text-muted-foreground">vs previous month</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${stats.growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.growthPercentage > 0 ? '+' : ''}{stats.growthPercentage}%
            </p>
          </div>
        </div>

        {/* Next Milestone */}
        {stats.nextMilestone && (
          <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Next Milestone</span>
              </div>
              <span className="text-lg">{stats.nextMilestone.achievementIcon}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{stats.nextMilestone.achievementName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.nextMilestone.remaining} more order{stats.nextMilestone.remaining !== 1 ? 's' : ''} to unlock
              </p>
            </div>
            <Progress 
              value={(stats.totalOrders / stats.nextMilestone.count) * 100} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats.totalOrders}</span>
              <span>{stats.nextMilestone.count}</span>
            </div>
          </div>
        )}

        {/* Achievement Points */}
        <div className="text-center p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground mb-1">Total Achievement Points</p>
          <p className="text-2xl font-bold text-primary">{stats.totalPoints}</p>
        </div>
      </CardContent>
    </Card>
  );
};
