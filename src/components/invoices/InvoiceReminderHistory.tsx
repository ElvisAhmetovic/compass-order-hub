import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";

interface ReminderLog {
  id: string;
  invoice_id: string;
  order_id: string;
  reminder_number: number;
  sent_at: string;
  sent_to_client: string | null;
  sent_to_team: boolean;
  created_at: string;
}

interface InvoiceReminderHistoryProps {
  invoice: Invoice;
}

const InvoiceReminderHistory: React.FC<InvoiceReminderHistoryProps> = ({ invoice }) => {
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const reminderCount = (invoice as any).reminder_count || 0;
  const nextReminderAt = (invoice as any).next_reminder_at;

  useEffect(() => {
    if (open) {
      loadReminders();
    }
  }, [open]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoice_payment_reminders")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("reminder_number", { ascending: false });

      if (!error && data) {
        setReminders(data as ReminderLog[]);
      }
    } catch (err) {
      console.error("Error loading reminder history:", err);
    } finally {
      setLoading(false);
    }
  };

  const isPaid = invoice.status === "paid";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={`${reminderCount} reminder(s) sent`}
          className="relative"
        >
          <Bell size={16} />
          {reminderCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {reminderCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell size={18} />
            Payment Reminders — {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Total Reminders Sent</span>
            <Badge variant={reminderCount > 0 ? "destructive" : "secondary"}>
              {reminderCount}
            </Badge>
          </div>

          {/* Next reminder status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
            {isPaid ? (
              <>
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Invoice paid — no more reminders scheduled</span>
              </>
            ) : nextReminderAt ? (
              <>
                <Clock size={16} className="text-amber-600" />
                <span>Next reminder: {new Date(nextReminderAt).toLocaleString('de-DE')}</span>
              </>
            ) : (
              <>
                <Clock size={16} className="text-muted-foreground" />
                <span>No reminders scheduled</span>
              </>
            )}
          </div>

          {/* Reminder list */}
          {loading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No reminders sent yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <Mail size={16} className="mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Reminder #{reminder.reminder_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reminder.sent_at).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {reminder.sent_to_client && (
                        <span>Client: {reminder.sent_to_client}</span>
                      )}
                      {reminder.sent_to_team && (
                        <span className="ml-2">• Team notified</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceReminderHistory;
