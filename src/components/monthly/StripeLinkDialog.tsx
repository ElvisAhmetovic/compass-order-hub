import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Mail, Copy, ExternalLink } from "lucide-react";

export const defaultProductName = (clientName: string, website: string | null) => `${clientName} – ${website || "Paket"}`;

/** Returns an error message, or null when the name is valid. */
export function validateProductName(name: string): string | null {
  const v = name.trim();
  if (!v) return "Product name is required";
  if (v.length > 120) return "Max 120 characters";
  return null;
}

export type LinkState = "none" | "paid" | "waiting" | "expired";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName: string;
  initialDescription: string;
  priceLabel: string;
  lengthLabel: string;
  busy: "save" | "send" | null;
  link: { url: string | null; state: LinkState; createdAt: string | null; sentAt: string | null };
  canEmail: boolean;
  onSave: (name: string, description: string) => void;
  onSend: () => void;
  onCopy: () => void;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }) : "");

const StripeLinkDialog: React.FC<Props> = ({ open, onOpenChange, initialName, initialDescription, priceLabel, lengthLabel, busy, link, canEmail, onSave, onSend, onCopy }) => {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setName(initialName); setDesc(initialDescription); setError(null); } }, [open, initialName, initialDescription]);

  const save = () => {
    const err = validateProductName(name);
    setError(err);
    if (!err) onSave(name.trim(), desc.trim());
  };
  const hasUsable = !!link.url && link.state === "waiting";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Stripe subscription link</DialogTitle>
          <DialogDescription>The client sees this name and description on the Stripe page, receipts and invoices.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="stripe-product-name">Product name</Label>
            <Input id="stripe-product-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. SEO Paket Premium – monatlich" />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripe-product-desc">Short description (optional)</Label>
            <Textarea id="stripe-product-desc" value={desc} maxLength={300} rows={3} onChange={(e) => setDesc(e.target.value)} />
            <p className="text-xs text-muted-foreground">{desc.length}/300</p>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Client pays</span><span className="font-semibold">{priceLabel}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Length</span><span>{lengthLabel}</span></div>
          </div>
        </div>

        {link.url && (
          <div className="rounded-md border p-3 space-y-2" data-testid="contract-link-box">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Badge variant={link.state === "expired" ? "destructive" : "secondary"}>{link.state === "expired" ? "Expired" : "Waiting for payment"}</Badge>
              {link.createdAt && <span>created {fmt(link.createdAt)}</span>}
              {link.sentAt && <span>· emailed {fmt(link.sentAt)}</span>}
            </div>
            {link.state === "expired" ? (
              <p className="text-xs text-muted-foreground">Stripe links are valid 24 hours. Click <b>New link</b> to make a fresh one.</p>
            ) : (
              <div className="flex gap-2">
                <Input readOnly value={link.url} className="h-8 text-xs" />
                <Button size="sm" variant="outline" onClick={onCopy} title="Copy for WhatsApp"><Copy className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" asChild><a href={link.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={save} disabled={!!busy}>
            {busy === "save" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {link.url ? "New link" : "Save link"}
          </Button>
          {hasUsable && (
            <Button onClick={onSend} disabled={!!busy || !canEmail} title={!canEmail ? "No client email" : undefined}>
              {busy === "send" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
              Send to client
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripeLinkDialog;
