import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Loader2, Mail, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { stripeBilling } from "@/services/stripeBillingService";
import { grossAmount } from "./orderStripeLinkMath";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: { id: string; company_name: string; contact_email?: string | null; price?: number | null; currency?: string | null; description?: string | null };
}

interface LinkRow { id: string; title: string; description: string | null; net_amount: number; vat_enabled: boolean; vat_rate: number; total_amount: number; currency: string; url: string | null; status: string; sent_at: string | null; paid_at: string | null }

const money = (v: number, c = "EUR") => new Intl.NumberFormat("de-DE", { style: "currency", currency: c }).format(v || 0);

const OrderStripeLinkDialog = ({ open, onOpenChange, order }: Props) => {
  const { toast } = useToast();
  const [link, setLink] = useState<LinkRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [net, setNet] = useState("");
  const [vatOn, setVatOn] = useState(true);
  const [rate, setRate] = useState("19");
  const [busy, setBusy] = useState<"save" | "send" | null>(null);
  const currency = (order.currency || "EUR").toUpperCase();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase.from as unknown as (t: string) => ReturnType<typeof supabase.from>)("order_payment_links")
        .select("*").eq("order_id", order.id).in("status", ["pending", "paid"]).order("created_at", { ascending: false }).limit(1);
      const row = ((data ?? []) as unknown as LinkRow[])[0] ?? null;
      setLink(row);
      setTitle(row?.title ?? order.company_name);
      setDescription(row?.description ?? "");
      setNet(String(row?.net_amount ?? order.price ?? ""));
      setVatOn(row ? row.vat_enabled : true);
      setRate(String(row?.vat_rate || 19));
    })();
  }, [open, order.id, order.company_name, order.price]);

  const netNum = parseFloat(net.replace(",", ".")) || 0;
  const total = grossAmount(netNum, vatOn, parseFloat(rate) || 0);

  const save = async () => {
    if (!title.trim() || netNum <= 0) { toast({ variant: "destructive", title: "Enter a title and a price" }); return; }
    setBusy("save");
    try {
      await stripeBilling("create_order_link", { order_id: order.id, title: title.trim(), description: description.trim() || undefined, net_amount: netNum, vat_enabled: vatOn, vat_rate: vatOn ? parseFloat(rate) || 0 : 0, currency });
      const { data } = await (supabase.from as unknown as (t: string) => ReturnType<typeof supabase.from>)("order_payment_links")
        .select("*").eq("order_id", order.id).eq("status", "pending").order("created_at", { ascending: false }).limit(1);
      setLink(((data ?? []) as unknown as LinkRow[])[0] ?? null);
      toast({ title: "Stripe payment link saved", description: link ? "The old link no longer works." : undefined });
    } catch (e) {
      toast({ variant: "destructive", title: "Could not create link", description: (e as Error).message });
    } finally { setBusy(null); }
  };

  const send = async () => {
    setBusy("send");
    try {
      await stripeBilling("send_order_link", { order_id: order.id });
      toast({ title: "Payment link emailed", description: order.contact_email ?? "" });
      setLink((l) => (l ? { ...l, sent_at: new Date().toISOString() } : l));
    } catch (e) {
      toast({ variant: "destructive", title: "Could not send", description: (e as Error).message });
    } finally { setBusy(null); }
  };

  const copy = async () => {
    if (!link?.url) return;
    await navigator.clipboard.writeText(link.url);
    toast({ title: "Link copied", description: "Paste it into WhatsApp or anywhere." });
  };

  const isPaid = link?.status === "paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Stripe payment link</DialogTitle>
          <DialogDescription>One-time payment for {order.company_name}. The client sees the title, description and total on the Stripe page.</DialogDescription>
        </DialogHeader>

        {isPaid ? (
          <div className="space-y-2 text-sm">
            <Badge>Paid {link?.paid_at ? new Date(link.paid_at).toLocaleDateString("de-DE") : ""}</Badge>
            <p><b>{link?.title}</b> – {money(link?.total_amount ?? 0, link?.currency)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Net price ({currency})</Label>
                <Input type="number" step="0.01" min="0" value={net} onChange={(e) => setNet(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>VAT rate (%)</Label>
                <Input type="number" step="1" min="0" max="30" value={rate} disabled={!vatOn} onChange={(e) => setRate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="stripe-vat">Add VAT</Label>
              <Switch id="stripe-vat" checked={vatOn} onCheckedChange={setVatOn} />
            </div>
            <div className="rounded-md bg-muted p-3 text-sm flex justify-between">
              <span>Client pays</span>
              <span className="font-semibold">{money(total, currency)}{vatOn ? ` (incl. ${rate}% VAT)` : ""}</span>
            </div>
          </div>
        )}

        {link?.url && !isPaid && (
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-xs text-muted-foreground">Current link · {money(link.total_amount, link.currency)}{link.sent_at ? ` · emailed ${new Date(link.sent_at).toLocaleDateString("de-DE")}` : ""}</p>
            <div className="flex gap-2">
              <Input readOnly value={link.url} className="h-8 text-xs" />
              <Button size="sm" variant="outline" onClick={copy}><Copy className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" asChild><a href={link.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!isPaid && (
            <Button variant="outline" onClick={save} disabled={!!busy}>
              {busy === "save" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {link ? "Save new link" : "Save link"}
            </Button>
          )}
          {link?.url && !isPaid && (
            <Button onClick={send} disabled={!!busy || !order.contact_email} title={!order.contact_email ? "No client email on this order" : undefined}>
              {busy === "send" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
              Send to client
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderStripeLinkDialog;
