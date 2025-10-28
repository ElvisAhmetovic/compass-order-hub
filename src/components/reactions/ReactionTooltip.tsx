import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReactionTooltipProps {
  users: Array<{ id: string; name: string }>;
  children: React.ReactNode;
}

export const ReactionTooltip = ({ users, children }: ReactionTooltipProps) => {
  if (users.length === 0) {
    return <>{children}</>;
  }

  const displayNames = users.slice(0, 3).map(u => u.name).join(', ');
  const remaining = users.length - 3;
  const tooltipText = remaining > 0 
    ? `${displayNames}, +${remaining} more`
    : displayNames;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
