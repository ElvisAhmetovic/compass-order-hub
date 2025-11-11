import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AchievementDefinition, AchievementTier } from '@/types/achievements';

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const AchievementBadge = ({ 
  achievement, 
  size = 'md',
  showTooltip = true 
}: AchievementBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs w-6 h-6',
    md: 'text-sm w-8 h-8',
    lg: 'text-base w-10 h-10',
  };

  const tierColors: Record<AchievementTier, string> = {
    bronze: 'bg-amber-600/20 border-amber-600/50 text-amber-600',
    silver: 'bg-gray-400/20 border-gray-400/50 text-gray-400',
    gold: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500',
    platinum: 'bg-purple-500/20 border-purple-500/50 text-purple-500',
  };

  const badgeContent = (
    <div 
      className={`
        ${sizeClasses[size]}
        ${tierColors[achievement.tier]}
        rounded-full 
        flex items-center justify-center
        border-2
        cursor-pointer
        transition-all duration-200
        hover:scale-110
        hover:shadow-lg
      `}
    >
      <span>{achievement.icon}</span>
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <span>{achievement.icon}</span>
              {achievement.name}
            </p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className={`text-xs ${tierColors[achievement.tier]}`}>
                {achievement.tier.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                +{achievement.points} pts
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
