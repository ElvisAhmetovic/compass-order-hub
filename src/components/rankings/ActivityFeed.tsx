import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { activityService } from '@/services/activityService';
import { TeamActivity } from '@/types/activity';
import { Trophy, Flame, TrendingUp, Target, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialActivities } = useQuery({
    queryKey: ['team-activities'],
    queryFn: () => activityService.getRecentActivities(20),
  });

  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities);
    }
  }, [initialActivities]);

  useEffect(() => {
    const unsubscribe = activityService.subscribeToActivities((newActivity) => {
      setActivities((prev) => [newActivity, ...prev].slice(0, 20));
      
      if (autoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    });

    return unsubscribe;
  }, [autoScroll]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const isAtTop = scrollRef.current.scrollTop < 50;
      setAutoScroll(isAtTop);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'achievement_unlocked':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'streak_milestone':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'rank_change':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'milestone_reached':
        return <Target className="h-4 w-4 text-purple-500" />;
      case 'order_created':
        return <Plus className="h-4 w-4 text-green-500" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'achievement_unlocked':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'streak_milestone':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'rank_change':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'milestone_reached':
        return 'bg-purple-500/10 border-purple-500/30';
      case 'order_created':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-muted';
    }
  };

  const getActivityMessage = (activity: TeamActivity): string => {
    switch (activity.activity_type) {
      case 'achievement_unlocked':
        return `unlocked ${activity.data.achievementIcon} ${activity.data.achievementName}`;
      case 'streak_milestone':
        return `reached a ${activity.data.streakCount} day streak! 🔥`;
      case 'rank_change':
        return `moved from #${activity.data.oldRank} to #${activity.data.newRank}`;
      case 'milestone_reached':
        return `reached ${activity.data.milestoneCount} orders milestone!`;
      case 'order_created':
        return `created order #${activity.data.orderCount}`;
      default:
        return 'had an activity';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="animate-pulse">🔴</span>
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea 
          className="h-[400px] px-4"
          ref={scrollRef as any}
          onScroll={handleScroll}
        >
          <div className="space-y-3 pb-4">
            {activities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">No activities yet</p>
                <p className="text-xs mt-1">Activities will appear here in real-time</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border
                    ${getActivityColor(activity.activity_type)}
                    animate-fade-in
                    transition-all duration-200 hover:scale-[1.02]
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.user_name}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {getActivityMessage(activity)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {activity.data.achievementTier && (
                    <Badge variant="outline" className="text-xs">
                      {activity.data.achievementTier}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {!autoScroll && (
          <div className="text-center py-2 border-t">
            <button
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = 0;
                  setAutoScroll(true);
                }
              }}
              className="text-xs text-primary hover:underline"
            >
              ↑ Scroll to top for new activities
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
