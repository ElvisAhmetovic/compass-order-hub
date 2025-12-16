import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Bell, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { PaymentReminderService, PaymentReminder } from "@/services/paymentReminderService";
import { Order } from "@/types";

interface ScheduleReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  existingReminder?: PaymentReminder | null;
  onReminderUpdated: () => void;
}

const ScheduleReminderModal = ({
  open,
  onOpenChange,
  order,
  existingReminder,
  onReminderUpdated,
}: ScheduleReminderModalProps) => {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (existingReminder && open) {
      const reminderDate = new Date(existingReminder.remind_at);
      setDate(reminderDate);
      setTime(format(reminderDate, "HH:mm"));
      setNote(existingReminder.note || "");
    } else if (open) {
      // Default to tomorrow at 9am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow);
      setTime("09:00");
      setNote("");
    }
  }, [existingReminder, open]);

  const handleSave = async () => {
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the reminder.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to set reminders.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const [hours, minutes] = time.split(":").map(Number);
    const reminderDateTime = new Date(date);
    reminderDateTime.setHours(hours, minutes, 0, 0);

    // Validate it's in the future
    if (reminderDateTime <= new Date()) {
      toast({
        title: "Invalid time",
        description: "Reminder must be scheduled for a future time.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Unknown";
      
      if (existingReminder) {
        await PaymentReminderService.updateReminder(
          existingReminder.id,
          reminderDateTime,
          note || null
        );
        toast({
          title: "Reminder updated",
          description: `Payment reminder updated for ${format(reminderDateTime, "PPP 'at' HH:mm")}`,
        });
      } else {
        await PaymentReminderService.createReminder(
          order.id,
          reminderDateTime,
          note || null,
          userName
        );
        toast({
          title: "Reminder scheduled",
          description: `Payment reminder set for ${format(reminderDateTime, "PPP 'at' HH:mm")}`,
        });
      }
      
      onReminderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast({
        title: "Error",
        description: "Failed to save reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!existingReminder) return;

    setIsDeleting(true);
    try {
      await PaymentReminderService.cancelReminder(existingReminder.id);
      toast({
        title: "Reminder cancelled",
        description: "Payment reminder has been cancelled.",
      });
      onReminderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error cancelling reminder:", error);
      toast({
        title: "Error",
        description: "Failed to cancel reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {existingReminder ? "Edit Payment Reminder" : "Schedule Payment Reminder"}
          </DialogTitle>
          <DialogDescription>
            Set a reminder for <span className="font-semibold">{order.company_name}</span> to follow up on payment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Date Picker */}
          <div className="grid gap-2">
            <Label htmlFor="date">Reminder Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="grid gap-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reminder Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Note */}
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add any notes about this payment reminder..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Order info summary */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="font-medium mb-1">Order Details</div>
            <div className="text-muted-foreground space-y-1">
              <p>Company: {order.company_name}</p>
              {order.price && <p>Amount: €{order.price.toLocaleString()}</p>}
              {order.contact_email && <p>Contact: {order.contact_email}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 w-full">
          <div className="flex justify-start">
            {existingReminder && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isDeleting || isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? "Cancelling..." : "Cancel Reminder"}
              </Button>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !date}>
              {isLoading ? "Saving..." : existingReminder ? "Update Reminder" : "Schedule Reminder"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleReminderModal;
