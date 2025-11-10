import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RankingData } from '@/services/rankingService';
import { Crown, Medal, Trophy } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';

interface RankingCardProps {
  ranking: RankingData;
  maxCount: number;
}

export const RankingCard = ({ ranking, maxCount }: RankingCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { triggerConfetti } = useConfetti();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Only trigger for rank 1 and only once per card appearance
    if (ranking.rank === 1 && !hasTriggeredRef.current && cardRef.current) {
      const timer = setTimeout(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
          // Calculate origin point relative to the card position
          const originX = (rect.left + rect.width / 2) / window.innerWidth;
          const originY = (rect.top + rect.height / 2) / window.innerHeight;
          
          triggerConfetti({
            origin: { x: originX, y: originY },
            colors: ['#FFD700', '#FFA500', '#FFED4E', '#F59E0B'],
          });
          
          hasTriggeredRef.current = true;
        }
      }, 600); // Delay to sync with card entrance animation

      return () => clearTimeout(timer);
    }
  }, [ranking.rank, triggerConfetti]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30';
      case 2:
        return 'from-gray-400/20 to-gray-500/5 border-gray-400/30';
      case 3:
        return 'from-amber-600/20 to-amber-700/5 border-amber-600/30';
      default:
        return 'from-background to-background';
    }
  };

  const progressPercentage = maxCount > 0 ? (ranking.orderCount / maxCount) * 100 : 0;

  return (
    <Card ref={cardRef} className={`relative transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 bg-gradient-to-br ${getRankColor(ranking.rank)}`}>
      {ranking.rank === 1 && (
        <div className="absolute inset-0 bg-yellow-500/10 rounded-lg blur-xl animate-pulse pointer-events-none" />
      )}
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-muted ${ranking.rank <= 3 ? 'transition-transform duration-200 hover:scale-110' : ''} ${ranking.rank === 1 ? 'animate-pulse' : ''}`}>
              {getRankIcon(ranking.rank) || (
                <span className="text-xl font-bold text-muted-foreground">#{ranking.rank}</span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{ranking.userName}</h3>
              <p className="text-sm text-muted-foreground">
                {ranking.orderCount} {ranking.orderCount === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={ranking.rank <= 3 ? 'default' : 'secondary'}
              className="animate-scale-in"
            >
              {ranking.percentage.toFixed(1)}%
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{ranking.orderCount} / {maxCount}</span>
          </div>
          <Progress value={progressPercentage} className="h-2 transition-all duration-1000 ease-out" />
        </div>

        {ranking.rank === 1 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium animate-fade-in">
            <Trophy className="h-4 w-4 animate-bounce" />
            <span className="animate-pulse">Current Leader</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
