import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OrderStatus } from "@/types";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: OrderStatus | null;
  enabling: boolean;
  onConfirm: (customMessage?: string) => void;
}

const StatusChangeDialog = ({
  open,
  onOpenChange,
  status,
  enabling,
  onConfirm,
}: StatusChangeDialogProps) => {
  const [message, setMessage] = useState("");

  const handleConfirm = (withMessage: boolean) => {
    onConfirm(withMessage && message.trim() ? message.trim() : undefined);
    setMessage("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setMessage("");
    onOpenChange(newOpen);
  };

  const action = enabling ? "Add" : "Remove";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action} Status: {status}
          </DialogTitle>
          <DialogDescription>
            {enabling
              ? `This will add "${status}" to the order. The client will be notified.`
              : `This will remove "${status}" from the order.`}
          </DialogDescription>
        </DialogHeader>

        {enabling && (
          <div className="space-y-2">
            <Label htmlFor="custom-message">
              Message for the client (optional)
            </Label>
            <Textarea
              id="custom-message"
              placeholder="e.g. Your complaint has been resolved and the review has been removed."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          {enabling && message.trim() ? (
            <>
              <Button variant="outline" onClick={() => handleConfirm(false)}>
                Skip Message
              </Button>
              <Button onClick={() => handleConfirm(true)}>
                Send with Message
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleConfirm(false)}>
                Confirm
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeDialog;
