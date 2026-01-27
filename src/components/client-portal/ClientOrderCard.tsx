import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Paperclip, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ClientOrder } from "@/services/clientOrderService";
import { getClientStatusFromOrder } from "@/utils/clientStatusTranslator";

interface ClientOrderCardProps {
  order: ClientOrder;
  attachmentCount?: number;
}

const ClientOrderCard = ({ order, attachmentCount = 0 }: ClientOrderCardProps) => {
  const statusConfig = getClientStatusFromOrder(order);
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

              {/* Progress Bar */}
              {!isCancelled && (
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
