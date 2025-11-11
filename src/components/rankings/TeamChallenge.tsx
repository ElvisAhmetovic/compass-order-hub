import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { challengeService } from '@/services/challengeService';
import { ChallengeProgress } from './ChallengeProgress';
import { Trophy, Sparkles } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';

export const TeamChallenge = () => {
  const { triggerConfetti } = useConfetti();
  const [previouslyCompleted, setPreviouslyCompleted] = useState<Set<string>>(new Set());
  const hasTriggeredConfetti = useRef<Set<string>>(new Set());

  const { data: challenges, refetch } = useQuery({
    queryKey: ['team-challenges-progress'],
    queryFn: () => challengeService.getAllChallengeProgress(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!challenges) return;

    challenges.forEach((progress) => {
      if (
        progress.isCompleted && 
        !previouslyCompleted.has(progress.challenge.id) &&
        !hasTriggeredConfetti.current.has(progress.challenge.id)
      ) {
        // Trigger confetti for newly completed challenge
        setTimeout(() => {
          triggerConfetti({
            origin: { x: 0.5, y: 0.5 },
            colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
          });
        }, 300);

        hasTriggeredConfetti.current.add(progress.challenge.id);
      }
    });

    // Update previously completed set
    const completedIds = new Set(
      challenges.filter(p => p.isCompleted).map(p => p.challenge.id)
    );
    setPreviouslyCompleted(completedIds);
  }, [challenges, previouslyCompleted, triggerConfetti]);

  const activeChallenges = challenges?.filter(p => !p.isCompleted) || [];
  const completedChallenges = challenges?.filter(p => p.isCompleted) || [];

  if (!challenges || challenges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Team Challenges
          </CardTitle>
          <CardDescription>Collaborative goals for the team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No active challenges</p>
            <p className="text-xs mt-1">Check back later for new team goals!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Team Challenges
        </CardTitle>
        <CardDescription>
          Work together to achieve these goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Active Challenges
            </h3>
            {activeChallenges.map((progress) => (
              <div
                key={progress.challenge.id}
                className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                <ChallengeProgress progress={progress} />
              </div>
            ))}
          </div>
        )}

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Completed
            </h3>
            {completedChallenges.map((progress) => (
              <div
                key={progress.challenge.id}
                className="p-4 rounded-lg border bg-green-500/5 border-green-500/20"
              >
                <ChallengeProgress progress={progress} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
