import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import type { CancellationMode } from "./cancellationEmail";

interface Props {
  open: boolean;
  mode: CancellationMode;
  invoiceId: string;
  invoiceNumber: string;
  recipient: string | null;
  onClose: () => void;
  /** Runs after Send or Skip (e.g. the actual delete). */
  onDone?: () => Promise<void> | void;
}

export default function InvoiceCancelNotifyDialog({ open, mode, invoiceId, invoiceNumber, recipient, onClose, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const finish = async (send: boolean) => {
    setBusy(true);
    try {
      if (send && recipient) {
        const { data, error } = await supabase.functions.invoke("send-invoice-cancellation", { body: { invoice_id: invoiceId, mode } });
        if (error) {
          const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
          throw new Error(details);
        }
        if (data?.sent) toast({ title: "Cancellation email sent", description: `Sent to ${data.to}` });
        else toast({ title: "Email not sent", description: String(data?.skipped || "skipped") });
      }
      await onDone?.();
      onClose();
    } catch (e) {
      toast({ title: "Could not send cancellation email", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const action = mode === "deleted" ? "deleted" : "cancelled";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notify client?</DialogTitle>
          <DialogDescription>
            Invoice <strong>{invoiceNumber}</strong> will be {action}. Send the client a professional cancellation (Storno) email?
          </DialogDescription>
        </DialogHeader>
        {recipient ? (
          <p className="text-sm">Recipient: <strong>{recipient}</strong> (copy to the invoice inbox)</p>
        ) : (
          <p className="text-sm text-destructive">This invoice has no client email, so no email can be sent.</p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => finish(false)}>
            {mode === "deleted" ? "Delete without email" : "Skip"}
          </Button>
          {recipient && (
            <Button disabled={busy} onClick={() => finish(true)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "deleted" ? "Send & delete" : "Send"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
