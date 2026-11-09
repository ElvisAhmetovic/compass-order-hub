import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, Loader2, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { stripeBilling, stripeStatusLabel, StripeContractFields } from "@/services/stripeBillingService";

interface Props {
  contract: StripeContractFields & { id: string; client_email: string; status: string };
  onChanged: () => void;
}

const StripeContractControls: React.FC<Props> = ({ contract, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const label = stripeStatusLabel(contract);
  const subscribed = !!contract.stripe_subscription_id && ["active", "trialing", "past_due", "unpaid"].includes(contract.stripe_status ?? "");
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); onChanged(); }
    catch (e) { toast({ title: "Stripe error", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const sendLink = () => run(async () => {
    const r = await stripeBilling("create_checkout", { contract_id: contract.id, send_email: true });
    if (r.url) await navigator.clipboard?.writeText(r.url).catch(() => undefined);
    toast({ title: "Stripe link sent", description: `Emailed to ${contract.client_email} and copied to your clipboard.` });
  });

  const cancel = () => run(async () => {
    const r = await stripeBilling("cancel", { contract_id: contract.id });
    toast({ title: "Subscription will cancel", description: r.cancel_at ? `Ends on ${new Date(r.cancel_at).toLocaleDateString("de-DE")}` : undefined });
  });

  return (
    <div className="flex items-center gap-2" onClick={stop}>
      {label && (
        <Badge variant={label === "Payment failed" ? "destructive" : label === "Stripe: active" ? "default" : "secondary"}>
          {label === "Cancels" && contract.cancel_at ? `Cancels ${new Date(contract.cancel_at).toLocaleDateString("de-DE")}` : label}
        </Badge>
      )}
      {!subscribed && contract.status === "active" && (
        <Button variant="outline" size="sm" className="h-8 px-2" disabled={busy} onClick={sendLink} title="Create a Stripe subscription link and email it to the client">
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CreditCard className="w-4 h-4 mr-1" />}
          {contract.payment_method === "stripe" ? "Resend Stripe link" : "Stripe link"}
        </Button>
      )}
      {!subscribed && contract.stripe_checkout_url && (
        <Button variant="ghost" size="sm" className="h-8 px-2" title="Copy last Stripe link (valid 24h)"
          onClick={() => { navigator.clipboard?.writeText(contract.stripe_checkout_url!); toast({ title: "Link copied" }); }}>
          <Copy className="w-4 h-4" />
        </Button>
      )}
      {subscribed && !contract.cancel_at && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2" disabled={busy}>Cancel Stripe</Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={stop}>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel the Stripe subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                The client is not charged again. It stays active until the end of the paid period. The client and the billing inbox get an email.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction onClick={cancel}>Cancel at period end</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default StripeContractControls;
