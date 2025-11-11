import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChallengeProgress as ChallengeProgressType } from '@/types/challenges';
import { CheckCircle2, Clock, Target } from 'lucide-react';

interface ChallengeProgressProps {
  progress: ChallengeProgressType;
}

export const ChallengeProgress = ({ progress }: ChallengeProgressProps) => {
  const getPeriodIcon = () => {
    switch (progress.challenge.period) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'monthly':
        return '🗓️';
    }
  };

  const getProgressColor = () => {
    if (progress.isCompleted) return 'bg-green-500';
    if (progress.percentage >= 75) return 'bg-blue-500';
    if (progress.percentage >= 50) return 'bg-yellow-500';
    if (progress.percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getPeriodIcon()}</span>
            <h4 className="font-semibold text-sm">{progress.challenge.name}</h4>
            {progress.isCompleted && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{progress.challenge.description}</p>
        </div>
        <Badge 
          variant={progress.isCompleted ? 'default' : 'secondary'}
          className="shrink-0"
        >
          {progress.current} / {progress.challenge.target}
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress 
          value={progress.percentage} 
          className={`h-3 transition-all duration-1000 ${progress.isCompleted ? 'animate-pulse' : ''}`}
        />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>{progress.percentage}% complete</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {progress.daysRemaining === 0 
                ? 'Ends today' 
                : `${progress.daysRemaining} day${progress.daysRemaining !== 1 ? 's' : ''} left`
              }
            </span>
          </div>
        </div>
      </div>

      {progress.isCompleted && (
        <div className="text-center py-2 bg-green-500/10 rounded-lg border border-green-500/30 animate-scale-in">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            🎉 Challenge Completed!
          </p>
        </div>
      )}

      {!progress.isCompleted && progress.remaining > 0 && (
        <div className="text-center py-1.5 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            {progress.remaining} more order{progress.remaining !== 1 ? 's' : ''} needed
          </p>
        </div>
      )}
    </div>
  );
};
