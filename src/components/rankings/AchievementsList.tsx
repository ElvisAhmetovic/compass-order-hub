import { AchievementBadge } from './AchievementBadge';
import { UserAchievement } from '@/types/achievements';

interface AchievementsListProps {
  achievements: UserAchievement[];
  maxDisplay?: number;
}

export const AchievementsList = ({ 
  achievements, 
  maxDisplay = 5 
}: AchievementsListProps) => {
  if (achievements.length === 0) return null;

  const displayAchievements = achievements.slice(0, maxDisplay);
  const remaining = achievements.length - maxDisplay;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayAchievements.map((userAchievement) => (
        userAchievement.achievement && (
          <AchievementBadge
            key={userAchievement.id}
            achievement={userAchievement.achievement}
            size="sm"
          />
        )
      ))}
      {remaining > 0 && (
        <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
          +{remaining} more
        </div>
      )}
    </div>
  );
};
