import React, { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";

const fmt = (iso: string, withTime = true) =>
  new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

export default function CancelledInvoiceInfo({ invoice }: { invoice: Invoice }) {
  const [by, setBy] = useState<string | null>(null);

  const loadName = async (open: boolean) => {
    if (!open || by || !invoice.cancelled_by) return;
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", invoice.cancelled_by)
      .maybeSingle();
    const d = data as { first_name?: string; last_name?: string } | null;
    setBy([d?.first_name, d?.last_name].filter(Boolean).join(" ") || null);
  };

  const when = invoice.cancelled_at;
  const reason = invoice.auto_cancelled_by_order
    ? "Order was marked Cancelled"
    : "Cancelled manually on the invoice";

  return (
    <AlertDialog onOpenChange={loadName}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Invoice cancelled">
                <XCircle size={16} />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{when ? `Cancelled on ${fmt(when, false)}` : "Cancelled"}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>This invoice is cancelled / Diese Rechnung wurde storniert</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1 text-sm">
              <p><strong>Invoice:</strong> {invoice.invoice_number}</p>
              <p><strong>Cancelled on:</strong> {when ? fmt(when) : "date not recorded"}</p>
              {by && <p><strong>Cancelled by:</strong> {by}</p>}
              <p><strong>Reason:</strong> {reason}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
