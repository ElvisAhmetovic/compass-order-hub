import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Paperclip, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ClientOrder } from "@/services/clientOrderService";

interface ClientOrderCardProps {
  order: ClientOrder;
  attachmentCount?: number;
}

const getProgressFromStatus = (order: ClientOrder): { progress: number; label: string } => {
  if (order.status_cancelled) return { progress: 0, label: "Cancelled" };
  if (order.status_resolved) return { progress: 100, label: "Completed" };
  if (order.status_invoice_paid) return { progress: 80, label: "Invoice Paid" };
  if (order.status_invoice_sent) return { progress: 60, label: "Invoice Sent" };
  if (order.status_in_progress) return { progress: 40, label: "In Progress" };
  if (order.status_created) return { progress: 10, label: "Created" };
  return { progress: 0, label: "Unknown" };
};

const ClientOrderCard = ({ order, attachmentCount = 0 }: ClientOrderCardProps) => {
  const { progress, label } = getProgressFromStatus(order);
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
                {isCancelled ? (
                  <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                ) : isCompleted ? (
                  <Badge className="bg-green-500 hover:bg-green-600 text-xs">Completed</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">{label}</Badge>
                )}
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
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress 
                    value={progress} 
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
