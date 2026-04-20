import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, Mail, Clock, CheckCircle2, X, Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";

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

const MAX_CC = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InvoiceReminderHistory: React.FC<InvoiceReminderHistoryProps> = ({ invoice }) => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [savingCc, setSavingCc] = useState(false);

  const reminderCount = (invoice as any).reminder_count || 0;
  const nextReminderAt = (invoice as any).next_reminder_at;

  useEffect(() => {
    if (open) {
      loadReminders();
      loadCcEmails();
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

  const loadCcEmails = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("cc_emails")
        .eq("id", invoice.id)
        .single();
      if (!error && data) {
        setCcEmails(((data as any).cc_emails as string[]) || []);
      }
    } catch (err) {
      console.error("Error loading cc emails:", err);
    }
  };

  const persistCcEmails = async (next: string[]) => {
    setSavingCc(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ cc_emails: next } as any)
        .eq("id", invoice.id);
      if (error) throw error;
      setCcEmails(next);
    } catch (err: any) {
      console.error("Error saving cc emails:", err);
      toast({
        title: "Failed to save",
        description: err?.message || "Could not update CC emails.",
        variant: "destructive",
      });
    } finally {
      setSavingCc(false);
    }
  };

  const handleAddEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (ccEmails.includes(email)) {
      toast({ title: "Already added", description: "This email is already in the list." });
      setNewEmail("");
      return;
    }
    if (ccEmails.length >= MAX_CC) {
      toast({ title: "Limit reached", description: `You can add up to ${MAX_CC} CC emails.`, variant: "destructive" });
      return;
    }
    const next = [...ccEmails, email];
    setNewEmail("");
    await persistCcEmails(next);
  };

  const handleRemoveEmail = async (email: string) => {
    const next = ccEmails.filter((e) => e !== email);
    await persistCcEmails(next);
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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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

          {/* Additional CC Emails */}
          <div className="space-y-2 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Additional CC Emails</span>
              <Badge variant="secondary" className="ml-auto">{ccEmails.length}/{MAX_CC}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              These addresses will be CC'd on every automated payment reminder for this invoice.
            </p>

            {ccEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ccEmails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 gap-1 font-normal"
                  >
                    <span className="text-xs">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      disabled={savingCc}
                      className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5 disabled:opacity-50"
                      aria-label={`Remove ${email}`}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                disabled={savingCc || ccEmails.length >= MAX_CC}
                className="h-9 text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddEmail}
                disabled={savingCc || !newEmail.trim() || ccEmails.length >= MAX_CC}
              >
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            </div>
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
                    <div className="text-xs text-muted-foreground mt-1 break-words">
                      {reminder.sent_to_client && (
                        <span>To: {reminder.sent_to_client}</span>
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
