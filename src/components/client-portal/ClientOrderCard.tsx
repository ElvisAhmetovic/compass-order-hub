import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Paperclip, Calendar, ArrowRight, Megaphone, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ClientOrder } from "@/services/clientOrderService";
import { getClientStatusFromOrder, getActionButtonConfig } from "@/utils/clientStatusTranslator";

interface ClientOrderCardProps {
  order: ClientOrder;
  attachmentCount?: number;
}

const ClientOrderCard = ({ order, attachmentCount = 0 }: ClientOrderCardProps) => {
  const statusConfig = getClientStatusFromOrder(order);
  const actionConfig = getActionButtonConfig(order);
  const isCancelled = order.status_cancelled;
  const isCompleted = order.status_resolved;

  return (
    <Link to={`/client/orders/${order.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              {/* Project Name & Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {order.company_name}
                </h3>
                <Badge 
                  variant={statusConfig.badgeVariant}
                  className={statusConfig.badgeClassName}
                >
                  {statusConfig.emoji} {statusConfig.label}
                </Badge>
              </div>

              {/* Date Created */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
              </div>

              {/* Action Button OR Progress Bar */}
              {actionConfig.showButton && actionConfig.url ? (
                <div className="pt-1">
                  <Button
                    asChild
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a 
                      href={actionConfig.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {actionConfig.label}
                    </a>
                  </Button>
                </div>
              ) : !isCancelled && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{statusConfig.progress}%</span>
                  </div>
                  <Progress 
                    value={statusConfig.progress} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Attachments Count */}
              {attachmentCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>{attachmentCount} file{attachmentCount !== 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Client Update Indicator */}
              {order.client_visible_update && (
                <div className="flex items-center gap-1.5 text-sm text-primary">
                  <Megaphone className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">
                    {order.client_visible_update.length > 50 
                      ? order.client_visible_update.substring(0, 50) + '...' 
                      : order.client_visible_update}
                  </span>
                </div>
              )}
            </div>

            {/* Arrow indicator */}
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ClientOrderCard;
