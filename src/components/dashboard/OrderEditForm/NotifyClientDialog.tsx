import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Order } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ClientNotificationService } from "@/services/clientNotificationService";
import { buildClientUpdateMessage } from "./clientUpdateMessage";

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotifyClientDialog = ({ order, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && order) setMessage(buildClientUpdateMessage(order));
  }, [open, order]);

  const email = order?.contact_email?.trim();

  const send = async () => {
    if (!order || !user?.id || !message.trim()) return;
    setSending(true);
    const result = await ClientNotificationService.sendManualUpdate({
      orderId: order.id,
      message: message.trim(),
      senderId: user.id,
      senderName: user.full_name || user.email || "Team",
    });
    setSending(false);
    if (result.success) {
      toast({ title: "Client notified", description: `Update sent to ${email || "the client"}` });
      onOpenChange(false);
    } else {
      toast({ title: "Could not notify client", description: result.error || "Email failed", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Notify client?</DialogTitle>
          <DialogDescription>
            {email
              ? <>The order was saved. Send this update to <strong>{email}</strong>? Internal notes and price are never included.</>
              : "The order was saved. This order has no client email, so no update can be sent."}
          </DialogDescription>
        </DialogHeader>
        {email && (
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="resize-none" />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Skip</Button>
          {email && (
            <Button onClick={send} disabled={sending || !message.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}Send
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotifyClientDialog;
