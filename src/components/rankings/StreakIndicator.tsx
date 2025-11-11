import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame } from 'lucide-react';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakIndicator = ({ 
  currentStreak, 
  longestStreak,
  size = 'md' 
}: StreakIndicatorProps) => {
  if (currentStreak === 0) return null;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-red-500';
    if (streak >= 3) return 'text-yellow-500';
    return 'text-orange-400';
  };

  const getStreakAnimation = (streak: number) => {
    if (streak >= 30) return 'animate-pulse';
    if (streak >= 7) return 'animate-bounce';
    return '';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`
              flex items-center gap-1
              ${sizeClasses[size]}
              ${getStreakColor(currentStreak)}
              font-bold
              cursor-pointer
              transition-all duration-200
              hover:scale-110
            `}
          >
            <Flame 
              size={iconSizes[size]} 
              className={`${getStreakAnimation(currentStreak)}`}
              fill="currentColor"
            />
            <span>{currentStreak}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="space-y-1">
            <p className="font-semibold">🔥 {currentStreak} Day Streak</p>
            <p className="text-xs text-muted-foreground">
              Consecutive days with at least 1 order
            </p>
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground">
                Personal best: {longestStreak} days
              </p>
            )}
            {currentStreak === longestStreak && longestStreak > 3 && (
              <p className="text-xs text-green-500 font-semibold">
                🎯 New personal record!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
