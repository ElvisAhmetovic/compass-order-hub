import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReactionTooltip } from "./ReactionTooltip";
import { cn } from "@/lib/utils";

interface ReactionButtonProps {
  emoji: string;
  count: number;
  hasUserReacted: boolean;
  users: Array<{ id: string; name: string }>;
  onClick: () => void;
  disabled?: boolean;
}

export const ReactionButton = ({
  emoji,
  count,
  hasUserReacted,
  users,
  onClick,
  disabled = false,
}: ReactionButtonProps) => {
  return (
    <ReactionTooltip users={users}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative h-8 px-2 transition-all duration-150 hover:scale-110",
          hasUserReacted
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
        )}
      >
        <span className="text-base leading-none">{emoji}</span>
        {count > 0 && (
          <Badge
            variant={hasUserReacted ? "default" : "secondary"}
            className={cn(
              "ml-1 h-4 min-w-[1rem] px-1 text-[10px] font-semibold",
              hasUserReacted
                ? "bg-primary/20 text-primary hover:bg-primary/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            {count}
          </Badge>
        )}
      </Button>
    </ReactionTooltip>
  );
};
