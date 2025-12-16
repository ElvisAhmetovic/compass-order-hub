import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Trash2, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PaymentReminderService, PaymentReminder } from "@/services/paymentReminderService";
import { useNavigate } from "react-router-dom";

interface ReminderWithOrder extends PaymentReminder {
  order: {
    id: string;
    company_name: string;
    price: number | null;
    contact_email: string | null;
  };
}

interface PaymentRemindersListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderUpdated: () => void;
}

export const PaymentRemindersListModal = ({
  open,
  onOpenChange,
  onReminderUpdated,
}: PaymentRemindersListModalProps) => {
  const [reminders, setReminders] = useState<ReminderWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await PaymentReminderService.getAllActiveRemindersWithOrders();
      setReminders(data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast({
        title: "Error",
        description: "Failed to load reminders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReminders();
    }
  }, [open]);

  const handleCancelReminder = async (reminderId: string) => {
    setDeletingId(reminderId);
    try {
      await PaymentReminderService.cancelReminder(reminderId);
      toast({
        title: "Reminder cancelled",
        description: "Payment reminder has been removed.",
      });
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      onReminderUpdated();
    } catch (error) {
      console.error("Error cancelling reminder:", error);
      toast({
        title: "Error",
        description: "Failed to cancel reminder.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewOrder = (orderId: string) => {
    onOpenChange(false);
    navigate(`/dashboard?orderId=${orderId}`);
  };

  const isOverdue = (remindAt: string) => {
    return new Date(remindAt) < new Date();
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return `€${Number(price).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Payment Reminders
          </DialogTitle>
          <DialogDescription>
            Manage all scheduled payment reminders. Cancel completed or unnecessary reminders.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-muted rounded-lg p-4 h-20" />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active payment reminders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`rounded-lg border p-4 ${
                    isOverdue(reminder.remind_at) 
                      ? "border-destructive/50 bg-destructive/5" 
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {reminder.order.company_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className={isOverdue(reminder.remind_at) ? "text-destructive font-medium" : ""}>
                          {isOverdue(reminder.remind_at) && "OVERDUE: "}
                          {format(new Date(reminder.remind_at), "PPP 'at' HH:mm")}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">{formatPrice(reminder.order.price)}</span>
                      </div>
                      {reminder.note && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {reminder.note}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(reminder.order.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelReminder(reminder.id)}
                        disabled={deletingId === reminder.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
