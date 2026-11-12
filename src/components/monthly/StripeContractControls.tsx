import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { stripeBilling, stripeStatusLabel, contractLinkState, StripeContractFields } from "@/services/stripeBillingService";
import StripeLinkDialog, { defaultProductName } from "./StripeLinkDialog";

interface Props {
  contract: StripeContractFields & {
    id: string; client_email: string; client_name: string; website: string | null; status: string;
    monthly_amount: number; currency: string; billing_frequency: number; vat_enabled: boolean | null; vat_rate: number | null;
    stripe_product_name?: string | null; stripe_product_description?: string | null;
    duration_months?: number | null; stripe_link_sent_at?: string | null;
  };
  onChanged: () => void;
}

const StripeContractControls: React.FC<Props> = ({ contract, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [dialogBusy, setDialogBusy] = useState<"save" | "send" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const vat = Number(contract.vat_rate ?? 0);
  const gross = Number(contract.monthly_amount) * (contract.vat_enabled ? 1 + (vat > 1 ? vat / 100 : vat) : 1);
  const per = contract.billing_frequency === 12 ? "year" : contract.billing_frequency > 1 ? `${contract.billing_frequency} months` : "month";
  const priceLabel = `${new Intl.NumberFormat("de-DE", { style: "currency", currency: contract.currency || "EUR" }).format(gross)} per ${per}`;
  const label = stripeStatusLabel(contract);
  const subscribed = !!contract.stripe_subscription_id && ["active", "trialing", "past_due", "unpaid"].includes(contract.stripe_status ?? "");
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); onChanged(); }
    catch (e) { toast({ title: "Stripe error", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const linkState = contractLinkState(contract);
  const lengthLabel = contract.duration_months ? `${contract.duration_months} months – stops automatically after the last payment` : "Until cancelled";

  const saveLink = async (product_name: string, product_description: string) => {
    setDialogBusy("save");
    try {
      const r = await stripeBilling("create_checkout", { contract_id: contract.id, send_email: false, product_name, product_description });
      if (r.url) await navigator.clipboard?.writeText(r.url).catch(() => undefined);
      toast({ title: "Stripe link saved", description: "Copied to your clipboard – paste it into WhatsApp or click Send to client." });
      onChanged();
    } catch (e) { toast({ title: "Stripe error", description: (e as Error).message, variant: "destructive" }); }
    finally { setDialogBusy(null); }
  };

  const sendLink = async () => {
    setDialogBusy("send");
    try {
      await stripeBilling("send_contract_link", { contract_id: contract.id });
      toast({ title: "Stripe link emailed", description: contract.client_email });
      onChanged();
    } catch (e) { toast({ title: "Could not send", description: (e as Error).message, variant: "destructive" }); }
    finally { setDialogBusy(null); }
  };

  const copyLink = async () => {
    if (!contract.stripe_checkout_url) return;
    await navigator.clipboard?.writeText(contract.stripe_checkout_url);
    toast({ title: "Link copied", description: "Paste it into WhatsApp or anywhere." });
  };

  const cancel = () => run(async () => {
    const r = await stripeBilling("cancel", { contract_id: contract.id });
    toast({ title: "Subscription will cancel", description: r.cancel_at ? `Ends on ${new Date(r.cancel_at).toLocaleDateString("de-DE")}` : undefined });
  });

  return (
    <div className="flex items-center gap-2" onClick={stop}>
      {label && (
        <Badge variant={label === "Payment failed" ? "destructive" : label === "Stripe: active" ? "default" : "secondary"}>
          {(label === "Cancels" || label === "Ends") && contract.cancel_at ? `${label} ${new Date(contract.cancel_at).toLocaleDateString("de-DE")}` : label}
        </Badge>
      )}
      {!subscribed && contract.status === "active" && (
        <Button variant="outline" size="sm" className="h-8 px-2" disabled={busy} onClick={() => setDialogOpen(true)} title="Create, save, copy or email a Stripe subscription link">
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CreditCard className="w-4 h-4 mr-1" />}
          {linkState === "waiting" ? "Stripe link ✓" : "Stripe link"}
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
      <StripeLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={contract.stripe_product_name || defaultProductName(contract.client_name, contract.website)}
        initialDescription={contract.stripe_product_description || ""}
        priceLabel={priceLabel}
        lengthLabel={lengthLabel}
        busy={dialogBusy}
        link={{ url: contract.stripe_checkout_url ?? null, state: linkState, createdAt: contract.stripe_checkout_created_at ?? null, sentAt: contract.stripe_link_sent_at ?? null }}
        canEmail={!!contract.client_email}
        onSave={saveLink}
        onSend={sendLink}
        onCopy={copyLink}
      />
    </div>
  );
};

export default StripeContractControls;
