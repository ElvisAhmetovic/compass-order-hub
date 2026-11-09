import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const defaultProductName = (clientName: string, website: string | null) => `${clientName} – ${website || "Paket"}`;

/** Returns an error message, or null when the name is valid. */
export function validateProductName(name: string): string | null {
  const v = name.trim();
  if (!v) return "Product name is required";
  if (v.length > 120) return "Max 120 characters";
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName: string;
  initialDescription: string;
  priceLabel: string;
  busy: boolean;
  onSend: (name: string, description: string) => void;
}

const StripeLinkDialog: React.FC<Props> = ({ open, onOpenChange, initialName, initialDescription, priceLabel, busy, onSend }) => {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setName(initialName); setDesc(initialDescription); setError(null); } }, [open, initialName, initialDescription]);

  const submit = () => {
    const err = validateProductName(name);
    setError(err);
    if (!err) onSend(name.trim(), desc.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Send Stripe subscription link</DialogTitle>
          <DialogDescription>This text is what the client sees on the Stripe payment page, receipts and invoices.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
          <p className="text-sm">Price: <span className="font-medium">{priceLabel}</span></p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Send link to client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripeLinkDialog;
